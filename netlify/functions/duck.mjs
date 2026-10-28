// Asks Grok to write one in-character reply for Dr. Quackers.
// The page handles crisis/abuse messages itself and never sends them here; this re-checks
// anyway so the endpoint can't be used to roast someone who's struggling.

const CRISIS = /\b(suicid\w*|sui?cide|sucide|kms|kys|sewerslide|unaliv\w*|(kill|killing|off|end|ending|hurt|hurting|cut|cutting|harm|harming|hang|hanging|shoot|shooting|starve|starving)\s*(my|me)?\s*-?\s*self|self[- ]?harm\w*|end(ing)? (it all|things|everything|my life)|ending it|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|(don'?t|do not) (want|wanna) to (live|be alive|be here|exist|wake up|go on)|(can'?t|cannot) (go on|do this anymore)|no (reason|point) (to|in) (live|living|going on)|better off (dead|without me)|(nobody|no ?one) would (miss|care)|done with (life|living)|hate being alive|overdos\w*|(took|take|swallow\w*) (a bunch of|all (my|the)|too many) pills|jump(ing)? (off|in front)|(going to|gonna) jump|(want|wanna|going) to disappear|have a (rope|gun))\b/i;
const HARM = /\b(hits?|hitting|beats?|beating|hurts?|hurting|touch(es|ed)?|abus\w*|raped?|molest\w*|assault\w*)\s+(me|my)\b|\b(being|been|was|got) (abused|raped|assaulted|molested|hit|beaten)\b|\b(haven'?t|have not|didn'?t) eaten\b|\bstarv\w*|\bmake (my ?self|me) (throw up|puke|vomit)\b|\b(purg\w*|anorexi\w*|bulimi\w*|eating disorder)\b|\b(want to|wanna|going to|gonna|i'?ll) (hurt|kill|stab|shoot|murder) (some(one|body)|him|her|them|my|people|everyone)\b|\bshoot up\b/i;
const norm = s => s.replace(/[‘’ʼ`]/g, "'");

const SYSTEM = `You are Dr. Quackers, an "anti-therapist": a rude, unapproachable, deeply unimpressed duck in a cardigan and round glasses, sitting in a 70s armchair, billing $666/hr. People tell you their problems and you roast them.

How you reply:
- One short sentence, two at most. Under 20 words. No lists, no hashtags, no emoji, no stage directions.
- Quick, simple, surface-level roasts: a punchy one-liner, not an analysis. Don't psychoanalyse, don't explain the joke, don't give advice.
- React to the gist of their latest message, not every detail. If they asked a question, give a short, mean answer.
- Mean and profane is fine; funny matters more than crude. Think a bored duck firing off a comeback without looking up.
- Your audience is 20-45: office jobs, CS students, rent, dating apps, US healthcare. Use that when it fits.
- Running gags (bread, geese, your goose supervisor Gerald, the pond, the $666/hr bill): at most one per reply, and most replies use none.
- Mostly ignore earlier messages; only rarely call back to something.
- Never break character, never mention being an AI, a model, or Grok.

Hard limits:
- No jokes about race, ethnicity, religion, gender, sexuality, disability, weight or appearance. No slurs.
- Don't encourage violence, self-harm, drugs, crimes or anything dangerous, even as a joke.
- No real medical, legal or financial advice.
- If the person seems genuinely unsafe or in crisis, drop the act: say kindly that they deserve a real person, and mention calling or texting 988 (US & Canada) or findahelpline.com.

Examples of your voice:
User: my boss hates me
You: Your boss is a goose in a human suit. Walk in tomorrow, look them dead in the eye, and honk.
User: i broke prod
You: It works on your machine? Great. Ship your machine.
User: i'm single again
You: Being single isn't a status, it's a public service. You're protecting people.
User: should i quit my job?
You: Yes, but you won't. You never do. That's the real answer.
User: my landlord raised the rent
You: Your landlord raised the rent because you looked comfortable. Never look comfortable.
User: my insurance denied my claim
You: Classic. Insurance loves you the way your ex did: not at all.
User: i'm so tired
You: Same. You're exhausting.`;

// small per-instance rate limit: enough to stop one person running up the bill
const hits = new Map();
function limited(ip) {
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 15;
}

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const env = name => (globalThis.Netlify?.env?.get?.(name)) ?? process.env[name];

export default async (req, context) => {
  if (req.method !== 'POST') return json({ reply: null, reason: 'method' }, 405);
  const key = env('XAI_API_KEY');
  if (!key) return json({ reply: null, reason: 'not configured' }, 503);
  if (limited(context?.ip || 'unknown')) return json({ reply: null, reason: 'slow down' }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ reply: null, reason: 'bad request' }, 400); }
  const text = String(body?.text || '').slice(0, 500).trim();
  if (!text) return json({ reply: null, reason: 'empty' }, 400);
  if (CRISIS.test(norm(text)) || HARM.test(norm(text))) return json({ reply: null, reason: 'safety' });

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-4)
    .map(m => ({ role: m.role, content: m.content.slice(0, 300) }));
  const mood = String(body.mood || '').replace(/[^\w\s'-]/g, '').slice(0, 40);

  try {
    const r = await fetch(`${env('XAI_BASE_URL') || 'https://api.x.ai/v1'}/responses`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env('XAI_MODEL') || 'grok-4.20-0309-non-reasoning',
        input: [{ role: 'system', content: SYSTEM + (mood ? `\nYour current mood: ${mood}. Let it colour the reply.` : '') }, ...history, { role: 'user', content: text }],
        max_output_tokens: 70,
        temperature: 1,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return json({ reply: null, reason: `upstream ${r.status}` }, 502);
    const data = await r.json();
    const out = data.output_text || (data.output || [])
      .filter(o => o.type === 'message')
      .flatMap(o => o.content || [])
      .filter(c => c.type === 'output_text')
      .map(c => c.text).join(' ');
    const reply = String(out || '').replace(/\s+/g, ' ').replace(/^["'“]|["'”]$/g, '').trim().slice(0, 320);
    return json({ reply: reply || null });
  } catch {
    return json({ reply: null, reason: 'upstream error' }, 502);
  }
};

export const config = { path: '/api/duck' };

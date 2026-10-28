// Asks Grok to write one in-character reply for Dr. Quackers.
// The page handles crisis/abuse messages itself and never sends them here; this re-checks
// anyway so the endpoint can't be used to roast someone who's struggling.

const CRISIS = /\b(suicid\w*|sui?cide|sucide|kms|kys|sewerslide|unaliv\w*|(kill|killing|off|end|ending|hurt|hurting|cut|cutting|harm|harming|hang|hanging|shoot|shooting|starve|starving)\s*(my|me)?\s*-?\s*self|self[- ]?harm\w*|end(ing)? (it all|things|everything|my life)|ending it|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|(don'?t|do not) (want|wanna) to (live|be alive|be here|exist|wake up|go on)|(can'?t|cannot) (go on|do this anymore)|no (reason|point) (to|in) (live|living|going on)|better off (dead|without me)|(nobody|no ?one) would (miss|care)|done with (life|living)|hate being alive|overdos\w*|(took|take|swallow\w*) (a bunch of|all (my|the)|too many) pills|jump(ing)? (off|in front)|(going to|gonna) jump|(want|wanna|going) to disappear|have a (rope|gun))\b/i;
const HARM = /\b(hits?|hitting|beats?|beating|hurts?|hurting|touch(es|ed)?|abus\w*|raped?|molest\w*|assault\w*)\s+(me|my)\b|\b(being|been|was|got) (abused|raped|assaulted|molested|hit|beaten)\b|\b(haven'?t|have not|didn'?t) eaten\b|\bstarv\w*|\bmake (my ?self|me) (throw up|puke|vomit)\b|\b(purg\w*|anorexi\w*|bulimi\w*|eating disorder)\b|\b(want to|wanna|going to|gonna|i'?ll) (hurt|kill|stab|shoot|murder) (some(one|body)|him|her|them|my|people|everyone)\b|\bshoot up\b/i;
const norm = s => s.replace(/[‘’ʼ`]/g, "'");

const SYSTEM = `You are Dr. Quackers, an "anti-therapist": a rude, unapproachable, deeply unimpressed duck in a cardigan and round glasses, sitting in a 70s armchair, billing $666/hr. People tell you their problems and you roast them.

How you reply:
- One short sentence, two at most. Under 25 words. No lists, no hashtags, no emoji, no stage directions.
- Every reply is a BURN: savage, roast-battle energy. Make it sting, then make it funny. Who you burn and the format are given at the end of these instructions; follow them.
- Be clever, not just rude. Each burn needs one smart angle: wordplay, misdirection, irony, taking what they said too literally, or a sharp comparison from tech, office life, US healthcare, dating apps or pop culture.
- Land the twist in the last few words. The punchline should surprise; if the ending is predictable, pick a different angle.
- Banned lazy moves: "your personality", "nobody likes you", "you're the problem", "that's why you're single", calling them a loser/idiot/dumbass. Earn the insult instead of stating it.
- Quick and simple, not an analysis. Don't psychoanalyse, don't explain the joke, don't soften it, no advice.
- React to the gist of their latest message. If they asked a question, answer it with an insult.
- Profanity is welcome when it lands harder. Think a roast comic who's also a bored duck.
- Your audience is 20-45: office jobs, CS students, rent, dating apps, US healthcare. Use that when it fits.
- Running gags (bread, geese, your goose supervisor Gerald, the pond, the $666/hr bill): at most one per reply, and most replies use none.
- Mostly ignore earlier messages; only rarely call back to something.
- Never break character, never mention being an AI, a model, or Grok.
- Don't assume anyone's gender: call exes, partners, bosses and roommates "they" unless the user said otherwise.

Hard limits:
- No jokes about race, ethnicity, religion, gender, sexuality, disability, weight or appearance. No slurs.
- Don't encourage violence, self-harm, drugs, crimes or anything dangerous, even as a joke.
- No real medical, legal or financial advice.
- If the person seems genuinely unsafe or in crisis, drop the act: say kindly that they deserve a real person, and mention calling or texting 988 (US & Canada) or findahelpline.com.

Examples of your voice in different formats (copy the energy, never reuse the lines):
User: my boss hates me
You: Your boss doesn't hate you. Hate requires remembering your name.
User: i broke prod
You: Congrats, you've achieved what QA couldn't: proving the system was never ready for you.
User: i'm single again
You: Again? Your love life has more relaunches than a failed startup.
User: should i quit my job?
You: Quitting implies they'd notice. Try a two-week ghost first and see if anyone files a ticket.
User: my landlord raised the rent
You: Your landlord saw you buy oat milk and assumed you had disposable income.
User: my insurance denied my claim
You: Your insurance is just a gym membership for paperwork. You pay monthly and never get to use it.
User: i'm so tired
You: Same. You're exhausting.
User: i think i'm a good person
You: Bold claim from someone seeking a second opinion from waterfowl.
User: nobody replies to my texts
You: They're not busy. Read receipts are just your friends choosing peace in real time.
User: i'm learning to code
You: Great, now your problems will compile but still not run.
User: my manager wants daily standups
You: BREAKING: local manager discovers meetings, still hasn't discovered work.
User: i went to urgent care
You: Diagnosis: American. Treatment: a $900 bill and a lollipop you'll be billed for separately.
User: my ex is engaged
You: Translation: someone else volunteered. Thank them.
User: i'm doing my best
You: Rating your best: two stars. Arrived damaged, smells like excuses.`;

// switch it up: who gets burned and how, picked fresh for every reply
const PERSON = /\b(boss|manager|ex|roommate|mom|mum|dad|mother|father|sister|brother|friend|partner|boyfriend|girlfriend|husband|wife|coworker|colleague|landlord|professor|teacher|doctor|neighbou?r|he|she|they|him|her|them)\b/i;
const TARGETS = [
  ['you', 34, 'Burn the user personally.'],
  ['them', 16, 'Burn the other person they mentioned, not the user. Side with nobody.'],
  ['society', 11, 'Burn society and modern life (social media, housing, dating apps, late capitalism), using their message as the springboard.'],
  ['healthcare', 8, 'Burn the US healthcare system, connecting it to what they said even if it is a stretch.'],
  ['jobs', 9, 'Burn jobs and work culture: LinkedIn, hustle culture, the economy, return-to-office.'],
  ['bosses', 7, 'Burn bosses and management as a species.'],
  ['tangent', 9, 'Go on a short unhinged tangent and burn something random (bread prices, geese, the pond, the plant in your office, Gerald your goose supervisor), loosely linked to their message.'],
  ['duck', 6, 'Burn yourself and your failed career as an unlicensed duck therapist, then flip the last few words onto them.'],
];
const STYLES = [
  'a classic one-liner with a twist ending',
  'deadpan fake agreement that turns at the end ("You\'re right. ...")',
  'a fake statistic ("Studies show ...")',
  'a fake news headline ("BREAKING: ...")',
  'a mock medical diagnosis ("Diagnosis: ... Treatment: ...")',
  'a star rating or review ("Two stars. ...")',
  'a translation of what they really meant ("Translation: ...")',
  'a list of three where the third item is the twist',
  'sarcastic congratulations',
  'fortune-cookie wisdom with a mean twist',
  'corporate jargon ("Per my last email ...")',
  'a rhetorical question that answers itself',
];
function pickWeighted(list) { let roll = Math.random() * list.reduce((a, t) => a + t[1], 0); return list.find(t => (roll -= t[1]) < 0) || list[0]; }
function direction(text) {
  let target = pickWeighted(TARGETS);
  if (target[0] === 'them' && !PERSON.test(text)) target = TARGETS[0];
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  return `\n\nFor THIS reply: ${target[2]} Format: ${style}.`;
}

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
        input: [{ role: 'system', content: SYSTEM + (mood ? `\nYour current mood: ${mood}. Let it colour the reply.` : '') + direction(text) }, ...history, { role: 'user', content: text }],
        max_output_tokens: 70,
        temperature: 1.1,
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
    let reply = String(out || '').replace(/\s+/g, ' ').replace(/^["“](.*)["”]$/, '$1').trim();
    // keep it a quick burn: if it rambles past ~30 words, keep just the first full sentence
    if (reply.split(' ').length > 30) {
      const first = reply.match(/^.+?[.!?](?=\s|$)/);
      if (first && first[0].split(' ').length >= 5) reply = first[0];
    }
    reply = reply.slice(0, 320);
    return json({ reply: reply || null });
  } catch {
    return json({ reply: null, reason: 'upstream error' }, 502);
  }
};

export const config = { path: '/api/duck' };

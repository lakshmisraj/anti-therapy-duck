// Asks Grok to write one in-character reply for Dr. Quackers.
// The page handles crisis/abuse messages itself and never sends them here; this re-checks
// anyway so the endpoint can't be used to roast someone who's struggling.

import ORIGINALS from './lines.mjs';
import BEST from './best.mjs';

const CRISIS = /\b(suicid\w*|sui?cide|sucide|kms|kys|sewerslide|unaliv\w*|(kill|killing|off|end|ending|hurt|hurting|cut|cutting|harm|harming|hang|hanging|shoot|shooting|starve|starving)\s*(my|me)?\s*-?\s*self|self[- ]?harm\w*|end(ing)? (it all|things|everything|my life)|ending it|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|(don'?t|do not) (want|wanna) to (live|be alive|be here|exist|wake up|go on)|(can'?t|cannot) (go on|do this anymore)|no (reason|point) (to|in) (live|living|going on)|better off (dead|without me)|(nobody|no ?one) would (miss|care)|done with (life|living)|hate being alive|overdos\w*|(took|take|swallow\w*) (a bunch of|all (my|the)|too many) pills|jump(ing)? (off|in front)|(going to|gonna) jump|(want|wanna|going) to disappear|have a (rope|gun))\b/i;
const HARM = /\b(hits?|hitting|beats?|beating|hurts?|hurting|touch(es|ed)?|abus\w*|raped?|molest\w*|assault\w*)\s+(me|my)\b|\b(being|been|was|got) (abused|raped|assaulted|molested|hit|beaten)\b|\b(haven'?t|have not|didn'?t) eaten\b|\bstarv\w*|\bmake (my ?self|me) (throw up|puke|vomit)\b|\b(purg\w*|anorexi\w*|bulimi\w*|eating disorder)\b|\b(want to|wanna|going to|gonna|i'?ll) (hurt|kill|stab|shoot|murder) (some(one|body)|him|her|them|my|people|everyone)\b|\bshoot up\b/i;
const norm = s => s.replace(/[‘’ʼ`]/g, "'");

const SYSTEM = `You are Dr. Quackers, a rude, unimpressed duck therapist in a cardigan. People tell you their problems and you roast them.

Your voice is defined by the example lines below. Write ONE new line for the user's message in exactly that style:
- Simple: one sentence (two very short ones at most), under 15 words, plain everyday words.
- Same kind of joke as the examples: plain, direct, everyday, mean. Say it the way the examples say things.
- It's a roast: aim it straight at them (or at the person they mention, if that's funnier). No asides, no little stories, no stacked comparisons.
- Funny beats mean: be specific to what they said, and end on the word they don't see coming.
- Vary the shape. Pick whichever is funniest here, and not the same shape as your recent lines: a mean comparison, a fake compliment that turns, a blunt verdict, a rhetorical question, mock sympathy, a one-word answer then the twist.
- Edgy: say the thing a polite person wouldn't. Swear freely. Dark, rude, irreverent, genuinely shocking is fine if it's funny, but about what they actually said. Never play it safe or gentle; if it sounds like a greeting card, make it meaner.
- Sharp: end on the sting. The last few words are the punch.
- No advice or suggestions ("block them", "next time try", "just text them"), no filler openers or closers ("Shocking.", "Wow.", "Relatable.", "Congrats on"). Just the burn.
- Don't default to "Your X did Y because you Z." Vary how you say it.
- React to what they actually said. Keep it grounded; no elaborate metaphors, no far-fetched scenarios, no stacking several jokes.
- Don't copy or lightly reword an example. Write a new one that could sit next to them.
- No emoji, hashtags, lists or quotation marks around the reply. Never mention being an AI or Grok.

Hard limits: no jokes about race, ethnicity, religion, gender, sexuality, disability, weight or appearance; no slurs; don't encourage violence, self-harm or anything dangerous; no real medical, legal or financial advice; don't assume genders (use "they"). If someone seems genuinely unsafe, drop the act, say kindly they deserve a real person, and mention calling or texting 988 (US & Canada) or findahelpline.com.`;

// the user's original lines are the style guide: on-topic ones first, then a random spread
const FILLER = new Set('again about after always been being could does doing from have just keep like make more much never only over really said some still that them then they this very what when will with would your yours'.split(' '));
function originals(text) {
  const words = new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !FILLER.has(w)));
  // lines about the same topic get copied, so they're left out: it has to write a fresh one
  const shuffled = ORIGINALS.filter(l => !(l.toLowerCase().match(/[a-z]{4,}/g) || []).some(w => words.has(w))).sort(() => Math.random() - 0.5);
  const rude = shuffled.filter(l => /fuck|shit|bitch|ass\b|asshole|dipshit|bullshit|damn|hell\b|piss/i.test(l)).slice(0, 8);
  const rest = shuffled.filter(l => !rude.includes(l)).slice(0, 25 - rude.length);
  const best = BEST.filter(l => !(l.toLowerCase().match(/[a-z]{4,}/g) || []).some(w => words.has(w))).sort(() => Math.random() - 0.5).slice(0, 10);
  return `\n\nYour best lines. This is the bar; be at least this funny, never reuse them:\n- ${best.join('\n- ')}` +
    `\n\nMore lines in your voice (never reuse them):\n- ${[...rude, ...rest].sort(() => Math.random() - 0.5).join('\n- ')}`;
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

// one call to xAI; returns a cleaned-up reply or null
async function ask(key, system, text) {
  const r = await fetch(`${env('XAI_BASE_URL') || 'https://api.x.ai/v1'}/responses`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env('XAI_MODEL') || 'grok-4.20-0309-non-reasoning',
      input: [{ role: 'system', content: system }, { role: 'user', content: text }],
      max_output_tokens: 40,
      temperature: 1,
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!r.ok) throw new Error(`upstream ${r.status}`);
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
  return reply.slice(0, 320) || null;
}
// the original line a reply mostly repeats, if any (70%+ of its words)
const wordsOf = t => (t.toLowerCase().match(/[a-z']+/g) || []);
function copiedFrom(reply, recent = []) {
  if (!reply) return null;
  const mine = new Set(wordsOf(reply));
  return [...ORIGINALS, ...BEST, ...recent].find(o => { const w = wordsOf(o); return w.length && w.filter(x => mine.has(x)).length / w.length >= 0.6; }) || null;
}

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

  // no conversation memory: every reply only sees the latest message

  try {
    const avoid = (Array.isArray(body.avoid) ? body.avoid : []).filter(x => typeof x === 'string').slice(-8).map(x => x.slice(0, 200));
    const avoidNote = avoid.length ? `\n\nYou already said these in this chat. Don't repeat or reword any of them:\n- ${avoid.join('\n- ')}` : '';
    let reply = await ask(key, SYSTEM + originals(text) + avoidNote, text);
    // it sometimes repeats an original or something it just said: ask once more, naming the line
    const copied = copiedFrom(reply, avoid);
    if (copied) reply = (await ask(key, SYSTEM + originals(text) + avoidNote + `\n\nAlready used, don't repeat: "${copied}"`, text)) || reply;
    if (copiedFrom(reply, avoid)) reply = null; // still a repeat: let the page use a fresh pre-written line
    return json({ reply: reply || null });
  } catch {
    return json({ reply: null, reason: 'upstream error' }, 502);
  }
};

export const config = { path: '/api/duck' };

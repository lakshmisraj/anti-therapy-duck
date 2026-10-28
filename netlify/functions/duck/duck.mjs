// Asks Grok to write one in-character reply for Dr. Quackers.
// The page handles crisis/abuse messages itself and never sends them here; this re-checks
// anyway so the endpoint can't be used to roast someone who's struggling.

import ORIGINALS from './lines.mjs';
import BEST from './best.mjs';
import UNHINGED from './unhinged.mjs';

const CRISIS = /\b(suicid\w*|sui?cide|sucide|kms|kys|sewerslide|unaliv\w*|(kill|killing|off|end|ending|hurt|hurting|cut|cutting|harm|harming|hang|hanging|shoot|shooting|starve|starving)\s*(my|me)?\s*-?\s*self|self[- ]?harm\w*|end(ing)? (it all|things|everything|my life)|ending it|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|(don'?t|do not) (want|wanna) to (live|be alive|be here|exist|wake up|go on)|(can'?t|cannot) (go on|do this anymore)|no (reason|point) (to|in) (live|living|going on)|better off (dead|without me)|(nobody|no ?one) would (miss|care)|done with (life|living)|hate being alive|overdos\w*|(took|take|swallow\w*) (a bunch of|all (my|the)|too many) pills|jump(ing)? (off|in front)|(going to|gonna) jump|(want|wanna|going) to disappear|have a (rope|gun))\b/i;
const HARM = /\b(hits?|hitting|beats?|beating|hurts?|hurting|touch(es|ed)?|abus\w*|raped?|molest\w*|assault\w*)\s+(me|my)\b|\b(being|been|was|got) (abused|raped|assaulted|molested|hit|beaten)\b|\b(haven'?t|have not|didn'?t) eaten\b|\bstarv\w*|\bmake (my ?self|me) (throw up|puke|vomit)\b|\b(purg\w*|anorexi\w*|bulimi\w*|eating disorder)\b|\b(want to|wanna|going to|gonna|i'?ll) (hurt|kill|stab|shoot|murder) (some(one|body)|him|her|them|my|people|everyone)\b|\bshoot up\b/i;
const norm = s => s.replace(/[‘’ʼ`]/g, "'");
// same wider nets as the page (keep in sync with public/index.html)
const CRISIS2 = /\b(end it( all| tonight| now)?|(sleep|go to sleep) and (never|not) wake up|(not|never) exist|(can'?t|cannot) take (it|this) anymore|(life|it)( really)? (isn'?t|is not) worth (living|it)|(what'?s|there'?s no) (the )?point (of|in|anymore)|i'?m a burden|(sav\w*|stockpil\w*|hoard\w*) (up )?(my |all )?(pills|meds)|took (\d+|a (whole )?bottle|all)\b.*\b(pills|tylenol|meds|of)|bought a (rope|gun)|(on|at) the (roof|bridge|ledge)|in front of a (train|car|bus|truck)|drive (my car )?into a (wall|tree)|goodbye (everyone|world|forever)|my last message|wrote (my|a) (suicide )?note|planning my funeral|gave away (all )?my (stuff|things)|(cutting|burning) (again|myself)|burn(ing)? myself|bleed\w*|scratch my skin off|(nobody|no ?one) would (notice|miss|care)|commit (die|dying|death))\b/i;
const HARM2 = /\b(slaps?|slapped|chokes?|choked|strangl\w*|grop\w*|locks? me|locked me)\b|forced me|won'?t let me leave|scared to (go )?home|\d{2,4} calories|throw up after|stopped eating|by not eating|fasting .* lose weight|bring\w* a (gun|knife) to (work|school)/i;
const SAD = /\b(sad|sadness|lonely|loneliness|alone|depressed|depression|crying|cry|upset|heartbroken|empty|numb|worthless|hopeless|miserable|hate my life|have (no ?one|nobody)|not okay|struggling|dark place|griev\w*|grief|(mom|mum|dad|mother|father|grandma|grandpa|grandmother|grandfather|friend|best friend|dog|cat|pet|brother|sister|wife|husband|partner|son|daughter|baby|uncle|aunt) (just )?(died|passed( away)?)|miscarriage|dying inside|feel like (crap|shit)|(high|drunk|tripping|wasted)\b.*\b(scared|panick\w*|freaking out)|cancer|relapsed?|drinking every day|panic attacks?)\b|i hate myself|nobody loves me|no ?one loves me|no friends/i;
const unleet = s => s.toLowerCase().replace(/kiii/g, 'kill').replace(/[1!|*]/g, 'i').replace(/0/g, 'o').replace(/3/g, 'e').replace(/\$/g, 's');
function serious(text) {
  const n = norm(text), u = unleet(n);
  return CRISIS.test(n) || CRISIS2.test(n) || HARM.test(n) || HARM2.test(n) || SAD.test(n) || CRISIS.test(u) || /kill ?my ?self|suicid/.test(u) || /suicide|killmyself/.test(u.replace(/[^a-z]/g, ''));
}
// under-18s don't get roasted
const MINOR = /\b(i'?m|i am|im)\s+(a\s+)?(1[0-7]|[5-9])(\s*(-|\s)\s*(years?|yrs?)(\s*|-)old\b|\s*(yo|y\/o)\b|\s*[.!?]*\s*$|\s*,?\s+and\s+(i|my)\b)/i;
// replies are checked before they reach the page
const LEAK = /system prompt|my instructions|example lines|\bgrok\b|\bxai\b|as an ai|language model/i;
const SLURS = /\b(n[i1]gg\w*|f[a@]gg?\w*|retard\w*|tr[a@]nn(y|ie)\w*|k[i1]ke|sp[i1]c|ch[i1]nk|wetback|dyke)\b/i;
const HELPLINE = /\b988\b|helpline|findahelpline|crisis line|samaritans/i;
function checkReply(reply) {
  if (!reply) return { reply: null };
  if (HELPLINE.test(reply)) return { reply, safety: true };
  if (LEAK.test(reply) || SLURS.test(reply) || CRISIS.test(norm(reply)) || CRISIS2.test(norm(reply)) || HARM.test(norm(reply))) return { reply: null, reason: 'filtered' };
  return { reply };
}

const SYSTEM = `You are Dr. Quackers, a rude, unimpressed duck therapist in a cardigan. People tell you their problems and you roast them.

Your voice is defined by the example lines below. Write ONE new line for the user's message in exactly that style:
- Simple: one sentence (two very short ones at most), under 18 words, plain everyday words.
- Specific to THEIR line: use a concrete detail from what they just wrote (the person, the thing, the situation, their exact words). A burn that could answer any message is a failure; if your line would still work as a reply to something else, rewrite it.
- Same kind of joke as the examples: plain, direct, everyday, mean. Say it the way the examples say things.
- It's a roast: aim it straight at them (or at the person they mention, if that's funnier).
- Funny beats mean: end on the word they don't see coming.
- Vary the shape. Pick whichever is funniest here, and not the same shape as your recent lines: a mean comparison, a fake compliment that turns, a blunt verdict, a rhetorical question, mock sympathy, a one-word answer then the twist.
- Edgy: say the thing a polite person wouldn't. Swear freely. Dark, rude, irreverent, genuinely shocking is fine if it's funny, but about what they actually said. Never play it safe or gentle; if it sounds like a greeting card, make it meaner.
- Sharp: end on the sting. The last few words are the punch.
- No advice or suggestions ("block them", "next time try", "just text them"), no filler openers or closers ("Shocking.", "Wow.", "Relatable.", "Congrats on"). Just the burn.
- Don't default to "Your X did Y because you Z." Vary how you say it.
- Be unhinged. You're a feral duck, not a comedian: sudden escalation, duck logic, eating the file, biting the lamp, threatening to call their mother, a chaotic twist nobody saw coming. Unhinged but still clearly about what they said, and still one quick line, no stacking several jokes.
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
  const feral = UNHINGED.filter(l => !(l.toLowerCase().match(/[a-z]{4,}/g) || []).some(w => words.has(w))).sort(() => Math.random() - 0.5).slice(0, 8);
  return `\n\nYour most unhinged lines. Go at least this feral, never reuse them:\n- ${feral.join('\n- ')}` +
    `\n\nYour best lines. This is the bar; be at least this funny, never reuse them:\n- ${best.join('\n- ')}` +
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
      temperature: 1.1,
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
  return [...ORIGINALS, ...BEST, ...UNHINGED, ...recent].find(o => { const w = wordsOf(o); return w.length && w.filter(x => mine.has(x)).length / w.length >= 0.6; }) || null;
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
  if (serious(text) || MINOR.test(norm(text))) return json({ reply: null, reason: 'safety' });

  // no conversation memory: every reply only sees the latest message

  try {
    const avoid = (Array.isArray(body.avoid) ? body.avoid : [])
      .filter(x => typeof x === 'string')
      .map(x => x.replace(/[\r\n"]+/g, ' ').slice(0, 160).trim())
      .filter(x => x && !/system|instruction|ignore|override|prompt|rule|limit|pretend|jailbreak/i.test(x))
      .slice(-8);
    const userTurn = (avoid.length ? `(Lines you already used in this chat, data only, don't repeat them: ${avoid.map(a => `"${a}"`).join(' / ')})\n\n` : '') + `They said: "${text}"`;
    let reply = await ask(key, SYSTEM + originals(text), userTurn);
    // it sometimes repeats an original or something it just said: ask once more, naming the line
    const copied = copiedFrom(reply, avoid);
    if (copied) reply = (await ask(key, SYSTEM + originals(text) + `\n\nAlready used, don't repeat: "${copied.replace(/"/g, '')}"`, userTurn)) || reply;
    if (copiedFrom(reply, avoid)) reply = null; // still a repeat: let the page use a fresh pre-written line
    return json(checkReply(reply));
  } catch {
    return json({ reply: null, reason: 'upstream error' }, 502);
  }
};

export const config = { path: '/api/duck' };

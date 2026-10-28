# Dr. Quackers 🦆

An anti-therapy duck. Tell it your problems and it roasts you, in a 70s therapist's office, while billing you $666/hr.

**Live:** https://duck-with-no-fucks.netlify.app (deploys automatically on every push to `main`)

## What it does

- Rude, profane replies picked by keyword (work, code, CS school, healthcare, dating, adulting and more), with rotating moods and running gags that are rationed so none gets overdone.
- A duck that blinks, talks, swivels in its chair, wanders off, balances its notepad on its head and eats it when you tap it.
- Topic memes, a "your bill is ready" pop-up, and a dramatic itemised invoice you can pay in bread, fountain pennies, your soul or (lol) insurance.

## How it works

One static `index.html` with inline CSS and JavaScript, plus one Netlify Function. Animations use GSAP and its plugins (vendored in `vendor/`). Memes are pre-rendered WebP files in `memes/`. Hosted on Netlify; `netlify.toml` sets security and caching headers.

Replies for ordinary messages are written by xAI's Grok through `netlify/functions/duck/duck.mjs` (served at `/api/duck`), which holds the API key, rate-limits, and re-checks for crisis messages. If the function isn't configured or fails, the duck falls back to its pre-written lines. Crisis, abuse and sad messages are always handled in the page and never sent to the AI.

### Layout

- `public/`: the site (`index.html`, memes, vendored GSAP, `stats.html`). Netlify publishes only this folder.
- `netlify/functions/`: `duck/` (AI replies: `duck.mjs`, plus the example lines in `lines.mjs` and `best.mjs`), `track.mjs` and `stats.mjs` (analytics).

### Analytics

The page batches anonymous counts (visits, messages, AI vs fallback replies, memes, bills, Ko-fi clicks and so on) and sends them a few times per visit to `/api/track`, which stores daily totals in Netlify Blobs with device type and country. No cookies, no message text, no IPs stored. View them at `/stats.html` (unlisted, `noindex`).

### Configuration (Netlify environment variables)

- `XAI_API_KEY` (required for AI replies)
- `XAI_MODEL` (optional, defaults to `grok-4.20-0309-non-reasoning`)

## Safety

The duck is a joke, not a therapist. If someone mentions self-harm, abuse, an eating disorder or hurting someone, it drops the bit, shows helplines (988 in the US and Canada, Samaritans, findahelpline.com) and stays out of character for the rest of the session.

## Run locally

Open `public/index.html` in a browser, or serve the folder (AI replies and analytics need Netlify Functions, so they fall back or stay off locally):

```bash
python3 -m http.server 8000 --directory public
```

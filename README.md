# Dr. Quackers 🦆

An anti-therapy duck. Tell it your problems and it roasts you, in a 70s therapist's office, while billing you $666/hr.

**Live:** https://tiny-chimera-0b269d.netlify.app

## What it does

- Rude, profane replies picked by keyword (work, code, CS school, healthcare, dating, adulting and more), with rotating moods and running gags that are rationed so none gets overdone.
- A duck that blinks, talks, swivels in its chair, wanders off, balances its notepad on its head and eats it when you tap it.
- Topic memes, a "your bill is ready" pop-up, and a dramatic itemised invoice you can pay in bread, fountain pennies, your soul or (lol) insurance.

## How it works

One static `index.html` with inline CSS and JavaScript. No framework, no build step, no backend and no AI: every reply is pre-written and chosen in the browser, so nothing you type is stored or sent anywhere. Memes are pre-rendered WebP files in `memes/`. Hosted on Netlify; `netlify.toml` sets security and caching headers.

## Safety

The duck is a joke, not a therapist. If someone mentions self-harm, abuse, an eating disorder or hurting someone, it drops the bit, shows helplines (988 in the US and Canada, Samaritans, findahelpline.com) and stays out of character for the rest of the session.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

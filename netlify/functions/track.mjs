// Counts anonymous events from the duck page into Netlify Blobs, one record per day.
// No cookies, no message text, no IPs stored: just event counts, device type and country.
import { getStore } from '@netlify/blobs';

const EVENTS = new Set(['visit', 'message', 'ai_reply', 'fallback_reply', 'crisis', 'meme', 'bill_open', 'bill_paid', 'dispute', 'coffee_shown', 'coffee_click', 'info_open', 'poke', 'new_session', 'share']);
const PAYMENTS = new Set(['bread', 'coins', 'soul', 'insurance']);

// small per-instance rate limit so nobody can flood the counters
const hits = new Map();
function limited(ip) {
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 30;
}

const add = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (limited(context?.ip || 'unknown')) return new Response(null, { status: 429 });

  let body;
  try { body = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  const events = (Array.isArray(body?.events) ? body.events : []).slice(0, 60).filter(ev => ev && EVENTS.has(ev.e));
  if (!events.length) return new Response(null, { status: 204 });

  const device = body.device === 'phone' ? 'phone' : 'desktop';
  const country = String(context?.geo?.country?.code || '??').slice(0, 2);
  const day = new Date().toISOString().slice(0, 10);

  const store = getStore({ name: 'duck-stats', consistency: 'strong' });
  const rec = (await store.get(day, { type: 'json' })) || { events: {}, devices: {}, countries: {}, payments: {} };
  for (const ev of events) {
    add(rec.events, ev.e);
    if (ev.e === 'visit') { add(rec.devices, device); add(rec.countries, country); }
    if (ev.e === 'bill_paid' && PAYMENTS.has(ev.how)) add(rec.payments, ev.how);
  }
  await store.setJSON(day, rec);
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/track' };

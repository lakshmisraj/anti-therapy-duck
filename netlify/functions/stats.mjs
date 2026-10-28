// Daily anonymous usage counts for the stats page (aggregates only, nothing personal).
import { getStore } from '@netlify/blobs';

const EMPTY = { events: {}, devices: {}, countries: {}, payments: {} };

export default async req => {
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30));
  const store = getStore({ name: 'duck-stats', consistency: 'strong' });
  const keys = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
  const records = await Promise.all(keys.map(k => store.get(k, { type: 'json' }).catch(() => null)));
  const data = keys.map((day, i) => ({ day, ...EMPTY, ...(records[i] || {}) }));
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};

export const config = { path: '/api/stats' };

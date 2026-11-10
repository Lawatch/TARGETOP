// Client minimal pour l'API publique Kraken Futures (aucune clé nécessaire).
const BASE = 'https://futures.kraken.com';
export const TF_MS = { '1m': 60e3, '5m': 300e3, '15m': 900e3, '30m': 1800e3, '1h': 3600e3, '4h': 14400e3, '1d': 86400e3 };

async function getJson(url, tries = 4) {
  let lastErr;
  for (let k = 0; k < tries; k++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'targetop-radar/1.0' }, signal: AbortSignal.timeout(20000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** k));
    }
  }
  throw lastErr;
}

export async function fetchTickers() {
  const d = await getJson(`${BASE}/derivatives/api/v3/tickers`);
  if (d.result !== 'success') throw new Error('tickers: ' + JSON.stringify(d).slice(0, 200));
  return d.tickers;
}

// Bougies [from, to) en ms. Pagine (2000 max/appel). Ne renvoie que les bougies CLÔTURÉES à `now`.
export async function fetchCandles(symbol, tf, fromMs, toMs = Date.now(), { now = Date.now() } = {}) {
  const ms = TF_MS[tf];
  const out = [];
  let from = Math.floor(fromMs / 1000);
  const to = Math.floor(toMs / 1000);
  for (let guard = 0; guard < 50; guard++) {
    const d = await getJson(`${BASE}/api/charts/v1/trade/${symbol}/${tf}?from=${from}&to=${to}`);
    const cs = (d.candles || []).map((c) => ({ t: c.time, o: +c.open, h: +c.high, l: +c.low, c: +c.close, v: +c.volume }));
    for (const c of cs) if (!out.length || c.t > out[out.length - 1].t) out.push(c);
    if (!d.more_candles || !cs.length) break;
    from = Math.floor(cs[cs.length - 1].t / 1000) + 1;
  }
  return out.filter((c) => c.t + ms <= now);
}

// Limiteur de concurrence simple.
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const my = idx++;
      try { results[my] = { ok: true, value: await fn(items[my], my) }; }
      catch (e) { results[my] = { ok: false, error: String(e.message || e) }; }
    }
  });
  await Promise.all(workers);
  return results;
}

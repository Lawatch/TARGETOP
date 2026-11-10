// Prépare une série de bougies + tous les indicateurs utilisés par les stratégies.
import { ema, rsi, atr, sma, bollinger, donchianPrev, adx } from './indicators.mjs';

export function buildSeries(candles) {
  const closes = candles.map((c) => c.c);
  const vols = candles.map((c) => c.v);
  const bb = bollinger(closes, 20, 2.5);
  const don = donchianPrev(candles, 48);
  return {
    candles,
    close: closes,
    ema20: ema(closes, 20),
    ema50: ema(closes, 50),
    ema200: ema(closes, 200),
    rsi14: rsi(closes, 14),
    atr14: atr(candles, 14),
    volSma20: sma(vols, 20),
    bbUpper: bb.upper,
    bbLower: bb.lower,
    bbMid: bb.mid,
    donHi48: don.hi,
    donLo48: don.lo,
    adx14: adx(candles, 14),
  };
}

// Index de la dernière bougie de `series` CLÔTURÉE au temps `t` (ms), sachant la durée `ms` d'une bougie.
export function lastClosedIndex(series, t, ms) {
  const cs = series.candles;
  let lo = 0, hi = cs.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cs[mid].t + ms <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

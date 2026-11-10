// Stratégies de détection. Chaque stratégie est une fonction pure :
//   detect(ctx, params) -> null | { side, entry, sl, reasons[], quality(0..1) }
// ctx = { s15, i, s1h, j, s4h, k, funding }  (i/j/k = index de la dernière bougie clôturée)
// Les TP sont calculés à partir du risque (R) via params.tp1R / params.tp2R.
// Les paramètres et le statut (live/shadow/disabled) sont dans config/strategies.json.

const ok = (x) => Number.isFinite(x);

function trendPullback(ctx, p) {
  const { s15, i, s1h, j, s4h, k, tfb = '15m', tfh = '1h' } = ctx;
  if (i < 60 || j < 60) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i];
  const e20 = s15.ema20[i], e50 = s15.ema50[i], r = s15.rsi14[i], rPrev = s15.rsi14[i - 1];
  const h20 = s1h.ema20[j], h50 = s1h.ema50[j], hAdx = s1h.adx14[j], hc = s1h.close[j];
  if (![a, e20, e50, r, rPrev, h20, h50, hAdx].every(ok)) return null;
  if (hAdx < p.minAdx1h) return null;
  const look = p.pullbackBars;
  let minLow = Infinity, maxHigh = -Infinity, touchedLong = false, touchedShort = false;
  for (let x = i - look; x <= i; x++) {
    const cx = s15.candles[x];
    minLow = Math.min(minLow, cx.l);
    maxHigh = Math.max(maxHigh, cx.h);
    if (x < i && cx.l <= s15.ema20[x] + p.touchAtr * a) touchedLong = true;
    if (x < i && cx.h >= s15.ema20[x] - p.touchAtr * a) touchedShort = true;
  }
  const bigTrendUp = s4h && k >= 50 ? s4h.ema20[k] > s4h.ema50[k] : null;
  const volRatio = s15.volSma20[i] > 0 ? c.v / s15.volSma20[i] : 1;
  const allowLong = p.require4h ? bigTrendUp === true : true;
  const allowShort = p.require4h ? bigTrendUp === false : true;
  const longOk = allowLong && p.sides !== 'short';
  const shortOk = allowShort && p.sides !== 'long';

  // LONG
  if (longOk && h20 > h50 && hc > h50 && e20 > e50 && touchedLong && c.c > e20 && c.c > c.o &&
      r > p.rsiMin && r < p.rsiMax && r > rPrev && (c.c - e50) / a < p.maxExtAtr) {
    const entry = c.c;
    let sl = minLow - p.slBufferAtr * a;
    const risk = entry - sl;
    if (risk < p.minRiskAtr * a) sl = entry - p.minRiskAtr * a;
    if (risk > p.maxRiskAtr * a) return null;
    const q = clamp01(0.35 * norm(hAdx, 18, 40) + 0.25 * (bigTrendUp === true ? 1 : bigTrendUp === null ? 0.5 : 0) +
      0.2 * norm(volRatio, 0.8, 2) + 0.2 * norm(r, 50, 62));
    return {
      side: 'long', entry, sl, quality: q,
      reasons: [`Tendance ${tfh} haussière (EMA20>EMA50, ADX ${hAdx.toFixed(0)})`,
        `Pullback sur EMA20 ${tfb} puis reprise (RSI ${r.toFixed(0)} ↗)`,
        bigTrendUp ? 'Tendance de fond alignée' : bigTrendUp === false ? '⚠ Tendance de fond contre' : 'Tendance de fond n/d'],
    };
  }
  // SHORT
  if (shortOk && h20 < h50 && hc < h50 && e20 < e50 && touchedShort && c.c < e20 && c.c < c.o &&
      r < 100 - p.rsiMin && r > 100 - p.rsiMax && r < rPrev && (e50 - c.c) / a < p.maxExtAtr) {
    const entry = c.c;
    let sl = maxHigh + p.slBufferAtr * a;
    const risk = sl - entry;
    if (risk < p.minRiskAtr * a) sl = entry + p.minRiskAtr * a;
    if (risk > p.maxRiskAtr * a) return null;
    const q = clamp01(0.35 * norm(hAdx, 18, 40) + 0.25 * (bigTrendUp === false ? 1 : bigTrendUp === null ? 0.5 : 0) +
      0.2 * norm(volRatio, 0.8, 2) + 0.2 * norm(100 - r, 50, 62));
    return {
      side: 'short', entry, sl, quality: q,
      reasons: [`Tendance ${tfh} baissière (EMA20<EMA50, ADX ${hAdx.toFixed(0)})`,
        `Pullback sur EMA20 ${tfb} puis rejet (RSI ${r.toFixed(0)} ↘)`,
        bigTrendUp === false ? 'Tendance de fond alignée' : bigTrendUp ? '⚠ Tendance de fond contre' : 'Tendance de fond n/d'],
    };
  }
  return null;
}

function breakoutVolume(ctx, p) {
  const { s15, i, s1h, j, tfb = '15m' } = ctx;
  if (i < 60 || j < 60) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], hi = s15.donHi48[i], lo = s15.donLo48[i], vs = s15.volSma20[i], r = s15.rsi14[i];
  const h50 = s1h.ema50[j], hc = s1h.close[j];
  if (![a, hi, lo, vs, r, h50].every(ok) || vs <= 0) return null;
  const range = c.h - c.l;
  if (range <= 0) return null;
  const volRatio = c.v / vs;
  const body = Math.abs(c.c - c.o) / range;
  const rangeWidthAtr = (hi - lo) / a;
  if (volRatio < p.minVolRatio || body < p.minBody) return null;
  if (rangeWidthAtr > p.maxRangeAtr) return null; // on veut casser une vraie consolidation
  const q = (dir) => clamp01(0.4 * norm(volRatio, p.minVolRatio, p.minVolRatio * 2.5) + 0.3 * body +
    0.3 * norm(p.maxRangeAtr - rangeWidthAtr, 0, p.maxRangeAtr * 0.7));

  if (c.c > hi && (c.c - c.l) / range > 0.7 && hc > h50 && r < p.maxRsi) {
    const entry = c.c;
    const sl = Math.min(entry - p.minRiskAtr * a, Math.max(hi - p.slBufferAtr * a, entry - p.maxRiskAtr * a));
    return { side: 'long', entry, sl, quality: q('long'),
      reasons: [`Cassure du plus haut des 48 bougies ${tfb} (${fmt(hi)})`, `Volume x${volRatio.toFixed(1)} la moyenne`,
        `Range de ${rangeWidthAtr.toFixed(1)} ATR comprimé`] };
  }
  if (c.c < lo && (c.h - c.c) / range > 0.7 && hc < h50 && r > 100 - p.maxRsi) {
    const entry = c.c;
    const sl = Math.max(entry + p.minRiskAtr * a, Math.min(lo + p.slBufferAtr * a, entry + p.maxRiskAtr * a));
    return { side: 'short', entry, sl, quality: q('short'),
      reasons: [`Cassure du plus bas des 48 bougies ${tfb} (${fmt(lo)})`, `Volume x${volRatio.toFixed(1)} la moyenne`,
        `Range de ${rangeWidthAtr.toFixed(1)} ATR comprimé`] };
  }
  return null;
}

function exhaustionReversal(ctx, p) {
  const { s15, i, s1h, j, tfh = '1h' } = ctx;
  if (i < 60 || j < 30) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], up = s15.bbUpper[i], dn = s15.bbLower[i], hr = s1h.rsi14[j];
  if (![a, up, dn, hr].every(ok)) return null;
  const range = c.h - c.l;
  if (range <= 0) return null;
  const upperWick = (c.h - Math.max(c.o, c.c)) / range;
  const lowerWick = (Math.min(c.o, c.c) - c.l) / range;
  if (hr > p.rsi1hHigh && c.h > up && c.c < up && upperWick > p.minWick) {
    const entry = c.c, sl = c.h + p.slBufferAtr * a;
    if (sl - entry > p.maxRiskAtr * a) return null;
    return { side: 'short', entry, sl, quality: clamp01(0.5 * norm(hr, p.rsi1hHigh, 90) + 0.5 * upperWick),
      reasons: [`RSI ${tfh} en surchauffe (${hr.toFixed(0)})`, 'Mèche de rejet au-dessus de la Bollinger 2.5σ', 'Contre-tendance : gestion serrée'] };
  }
  if (hr < p.rsi1hLow && c.l < dn && c.c > dn && lowerWick > p.minWick) {
    const entry = c.c, sl = c.l - p.slBufferAtr * a;
    if (entry - sl > p.maxRiskAtr * a) return null;
    return { side: 'long', entry, sl, quality: clamp01(0.5 * norm(100 - hr, 100 - p.rsi1hLow, 90) + 0.5 * lowerWick),
      reasons: [`RSI ${tfh} en capitulation (${hr.toFixed(0)})`, 'Mèche d\'absorption sous la Bollinger 2.5σ', 'Contre-tendance : gestion serrée'] };
  }
  return null;
}

function fundingSqueeze(ctx, p) {
  const { s15, i, funding } = ctx;
  if (!ok(funding) || i < 30) return null; // nécessite le funding live (pas dispo en backtest)
  const c = s15.candles[i], prev = s15.candles[i - 1];
  const a = s15.atr14[i], e20 = s15.ema20[i], pe20 = s15.ema20[i - 1], vs = s15.volSma20[i];
  if (![a, e20, pe20, vs].every(ok) || vs <= 0) return null;
  const volRatio = c.v / vs;
  if (volRatio < p.minVolRatio) return null;
  if (funding <= -p.fundingAbs && prev.c <= pe20 && c.c > e20) {
    const entry = c.c, sl = entry - p.riskAtr * a;
    return { side: 'long', entry, sl, quality: clamp01(norm(-funding, p.fundingAbs, p.fundingAbs * 4)),
      reasons: [`Funding très négatif (${(funding * 100).toFixed(4)}%/h) : shorts surchargés`, 'Reprise de l\'EMA20', `Volume x${volRatio.toFixed(1)}`] };
  }
  if (funding >= p.fundingAbs && prev.c >= pe20 && c.c < e20) {
    const entry = c.c, sl = entry + p.riskAtr * a;
    return { side: 'short', entry, sl, quality: clamp01(norm(funding, p.fundingAbs, p.fundingAbs * 4)),
      reasons: [`Funding très positif (${(funding * 100).toFixed(4)}%/h) : longs surchargés`, 'Perte de l\'EMA20', `Volume x${volRatio.toFixed(1)}`] };
  }
  return null;
}

// Faux breakout : la bougie perce le plus haut/bas 48 bougies puis réintègre le range => on joue le retour.
function failedBreakout(ctx, p) {
  const { s15, i, tfb = '15m' } = ctx;
  if (i < 60) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], hi = s15.donHi48[i], lo = s15.donLo48[i], vs = s15.volSma20[i];
  if (![a, hi, lo, vs].every(ok) || vs <= 0) return null;
  const range = c.h - c.l;
  if (range <= 0) return null;
  const volRatio = c.v / vs;
  if (volRatio < p.minVolRatio) return null;
  if (c.h > hi && c.c < hi && (c.h - c.c) / range > p.minReject && (c.h - hi) / a > p.minPokeAtr) {
    const entry = c.c, sl = c.h + p.slBufferAtr * a;
    if (sl - entry > p.maxRiskAtr * a || sl - entry < 0.3 * a) return null;
    return { side: 'short', entry, sl, quality: clamp01(0.5 * norm(volRatio, p.minVolRatio, 4) + 0.5 * norm((c.h - c.c) / range, p.minReject, 1)),
      reasons: [`Faux breakout du plus haut 48×${tfb} (${fmt(hi)}) puis réintégration`, `Rejet ${(100 * (c.h - c.c) / range).toFixed(0)}% de la bougie`, `Volume x${volRatio.toFixed(1)}`] };
  }
  if (c.l < lo && c.c > lo && (c.c - c.l) / range > p.minReject && (lo - c.l) / a > p.minPokeAtr) {
    const entry = c.c, sl = c.l - p.slBufferAtr * a;
    if (entry - sl > p.maxRiskAtr * a || entry - sl < 0.3 * a) return null;
    return { side: 'long', entry, sl, quality: clamp01(0.5 * norm(volRatio, p.minVolRatio, 4) + 0.5 * norm((c.c - c.l) / range, p.minReject, 1)),
      reasons: [`Faux breakout du plus bas 48×${tfb} (${fmt(lo)}) puis réintégration`, `Rejet ${(100 * (c.c - c.l) / range).toFixed(0)}% de la bougie`, `Volume x${volRatio.toFixed(1)}`] };
  }
  return null;
}

// --- Famille « volatilité » : compression des bandes de Bollinger puis expansion avec volume.
function squeezeBreakout(ctx, p) {
  const { s15, i, tfb = '15m' } = ctx;
  if (i < p.lookback + 5) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], w = s15.bbWidth, up = s15.bbUpper[i], dn = s15.bbLower[i], vs = s15.volSma20[i];
  if (![a, up, dn, vs, w[i - 1]].every(ok) || vs <= 0) return null;
  // la largeur des bandes juste avant doit être dans le bas de sa distribution récente
  const hist = w.slice(i - p.lookback, i).filter(ok).sort((x, y) => x - y);
  if (hist.length < p.lookback * 0.8) return null;
  const rank = hist.findIndex((x) => x >= w[i - 1]) / hist.length;
  if (rank < 0 || rank > p.maxWidthPct) return null;
  const volRatio = c.v / vs;
  if (volRatio < p.minVolRatio) return null;
  const q = clamp01(0.5 * (1 - rank / p.maxWidthPct) + 0.5 * norm(volRatio, p.minVolRatio, p.minVolRatio * 2.5));
  if (c.c > up) return { side: 'long', entry: c.c, sl: c.c - p.riskAtr * a, quality: q,
    reasons: [`Compression de volatilité (largeur Bollinger dans les ${Math.round(rank * 100)} % les plus bas)`, `Expansion haussière ${tfb} hors bande 2,5σ`, `Volume x${volRatio.toFixed(1)}`] };
  if (c.c < dn) return { side: 'short', entry: c.c, sl: c.c + p.riskAtr * a, quality: q,
    reasons: [`Compression de volatilité (largeur Bollinger dans les ${Math.round(rank * 100)} % les plus bas)`, `Expansion baissière ${tfb} hors bande 2,5σ`, `Volume x${volRatio.toFixed(1)}`] };
  return null;
}

// --- Famille « retour à la moyenne court terme » : RSI(2) extrême dans le sens de la tendance longue (EMA200).
function rsi2Pullback(ctx, p) {
  const { s15, i } = ctx;
  if (i < 210) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], r2 = s15.rsi2[i], e200 = s15.ema200[i];
  if (![a, r2, e200].every(ok)) return null;
  if (c.c > e200 && r2 < p.rsiLow) return { side: 'long', entry: c.c, sl: c.c - p.riskAtr * a, quality: clamp01(norm(p.rsiLow - r2, 0, p.rsiLow)),
    reasons: ['Tendance longue haussière (prix > EMA200)', `Excès vendeur court terme (RSI2 ${r2.toFixed(0)})`, 'Pari : rebond rapide vers la moyenne'] };
  if (c.c < e200 && r2 > 100 - p.rsiLow) return { side: 'short', entry: c.c, sl: c.c + p.riskAtr * a, quality: clamp01(norm(r2 - (100 - p.rsiLow), 0, p.rsiLow)),
    reasons: ['Tendance longue baissière (prix < EMA200)', `Excès acheteur court terme (RSI2 ${r2.toFixed(0)})`, 'Pari : rechute rapide vers la moyenne'] };
  return null;
}

// --- Famille « suivi de tendance » : cassure de canal dans une tendance établie, stop large et stop suiveur (gains asymétriques).
function donchianTrend(ctx, p) {
  const { s15, i } = ctx;
  if (i < 210) return null;
  const c = s15.candles[i];
  const a = s15.atr14[i], hi = s15.donHi48[i], lo = s15.donLo48[i], e50 = s15.ema50[i], e200 = s15.ema200[i];
  if (![a, hi, lo, e50, e200].every(ok)) return null;
  const strength = Math.abs(e50 - e200) / a;
  if (c.c > hi && e50 > e200 && c.c > e50) return { side: 'long', entry: c.c, sl: c.c - p.riskAtr * a, quality: clamp01(norm(strength, 0, 10)),
    reasons: [`Nouveau plus haut 48 bougies (${fmt(hi)})`, 'Tendance établie (EMA50 > EMA200)', 'Suivi de tendance : petits gains rares, gros gains possibles'] };
  if (c.c < lo && e50 < e200 && c.c < e50) return { side: 'short', entry: c.c, sl: c.c + p.riskAtr * a, quality: clamp01(norm(strength, 0, 10)),
    reasons: [`Nouveau plus bas 48 bougies (${fmt(lo)})`, 'Tendance établie (EMA50 < EMA200)', 'Suivi de tendance : petits gains rares, gros gains possibles'] };
  return null;
}

export const DETECTORS = {
  squeeze_breakout: squeezeBreakout,
  rsi2_pullback: rsi2Pullback,
  donchian_trend: donchianTrend,
  failed_breakout: failedBreakout,
  trend_pullback: trendPullback,
  breakout_volume: breakoutVolume,
  exhaustion_reversal: exhaustionReversal,
  funding_squeeze: fundingSqueeze,
};

// Lance une stratégie et complète le signal (TP, R:R, score).
// Rang centile (0..1) de l'ATR 4h relatif de BTC à l'index kb parmi les `look` bougies précédentes. null si indisponible.
export function btcVolPct(btc4h, kb, look = 120) {
  if (!btc4h || kb == null || kb < look || !btc4h.atr14 || !btc4h.close) return null;
  const v = btc4h.atr14[kb] / btc4h.close[kb];
  if (!ok(v)) return null;
  let below = 0, n = 0;
  for (let x = kb - look; x < kb; x++) {
    const h = btc4h.atr14[x] / btc4h.close[x];
    if (!ok(h)) continue;
    n++; if (h < v) below++;
  }
  return n >= look / 2 ? below / n : null;
}

export function runStrategy(strat, ctx, meta = {}) {
  const fn = DETECTORS[strat.detector];
  if (!fn) return null;
  const raw = fn(ctx, strat.params);
  if (!raw) return null;
  // Filtre de sens générique : params.sides = "long" | "short" (absent = les deux)
  if (strat.params.sides && strat.params.sides !== 'both' && raw.side !== strat.params.sides) return null;
  // Filtre de régime générique : params.regime = "with" (dans le sens de la tendance de fond EMA20/EMA50 du TF supérieur)
  // ou "against" (contre). Absent = pas de filtre.
  if (strat.params.regime) {
    const { s4h, k } = ctx;
    if (!s4h || k == null || k < 50 || !ok(s4h.ema20[k]) || !ok(s4h.ema50[k])) return null;
    const up = s4h.ema20[k] > s4h.ema50[k];
    const withTrend = (raw.side === 'long') === up;
    if ((strat.params.regime === 'with') !== withTrend) return null;
  }
  // Filtre de régime BTC générique : params.btcRegime = "with" (dans le sens de la tendance BTC 4h, EMA20/EMA50)
  // ou "against". Sans série BTC disponible, le signal est refusé (prudence).
  if (strat.params.btcRegime) {
    const { btc4h, kb } = ctx;
    if (!btc4h || kb == null || kb < 50 || !ok(btc4h.ema20[kb]) || !ok(btc4h.ema50[kb])) return null;
    const up = btc4h.ema20[kb] > btc4h.ema50[kb];
    const withBtc = (raw.side === 'long') === up;
    if ((strat.params.btcRegime === 'with') !== withBtc) return null;
  }
  // Filtre de volatilité BTC générique : params.btcVolMinPct (0..1) = rang centile minimal de l'ATR 4h relatif de BTC
  // (ATR14/clôture) parmi ses 120 dernières bougies 4h (~20 j). Ex. 0.33 = on ignore le tiers le plus calme.
  if (strat.params.btcVolMinPct != null) {
    const pct = btcVolPct(ctx.btc4h, ctx.kb);
    if (pct == null || pct < strat.params.btcVolMinPct) return null;
  }
  const risk = Math.abs(raw.entry - raw.sl);
  if (!(risk > 0)) return null;
  const dir = raw.side === 'long' ? 1 : -1;
  const tp1 = raw.entry + dir * risk * strat.params.tp1R;
  const tp2 = raw.entry + dir * risk * strat.params.tp2R;
  const liq = meta.volumeQuote ? norm(Math.log10(meta.volumeQuote), 6, 9) : 0.5;
  const score = Math.round(40 + 45 * raw.quality + 15 * liq);
  return {
    ...raw,
    strategy: strat.id,
    version: strat.version,
    status: strat.status,
    tp1, tp2,
    riskPct: (risk / raw.entry) * 100,
    atr: ctx.s15.atr14[ctx.i],
    score,
  };
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function norm(x, lo, hi) { return clamp01((x - lo) / (hi - lo)); }
function fmt(x) { return x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(3) : x.toPrecision(4); }

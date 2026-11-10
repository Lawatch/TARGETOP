// Logique commune scan live / backtest : construit le contexte multi-timeframe et lance les stratégies.
// Chaque stratégie a un timeframe de base `params.tf` ("15m" par défaut, ou "1h").
//   tf 15m : base=15m, htf=1h, htf2=4h      tf 1h : base=1h, htf=4h, htf2=4h
// (Les détecteurs nomment historiquement base=s15, htf=s1h, htf2=s4h.)
import { buildSeries, lastClosedIndex } from './series.mjs';
import { resample } from './indicators.mjs';
import { runStrategy } from './strategies.mjs';

export const MS15 = 900e3, MS1H = 3600e3, MS4H = 14400e3;
const TFMS = { '15m': MS15, '1h': MS1H, '4h': MS4H };

export function prepareSymbol(c15, c1h) {
  return { '15m': buildSeries(c15), '1h': buildSeries(c1h), '4h': buildSeries(resample(c1h, MS4H)) };
}

// Évalue les stratégies à l'instant `t` (ms). mode 'live' : dernière bougie clôturée de chaque TF ;
// mode 'replay' : une stratégie n'est évaluée que si sa bougie de base clôture exactement à t (pas de doublon).
export function evaluateAt(prep, t, strategies, meta = {}, mode = 'live') {
  const out = [];
  for (const st of strategies) {
    if (st.status === 'disabled') continue;
    const tf = st.params.tf || '15m';
    const [b, h, h2] = tf === '1h' ? ['1h', '4h', '4h'] : ['15m', '1h', '4h'];
    const base = prep[b];
    const i = lastClosedIndex(base, t, TFMS[b]);
    if (i < 1) continue;
    const closeT = base.candles[i].t + TFMS[b];
    if (mode === 'replay' && closeT !== t) continue;
    const ctx = {
      s15: base, i,
      s1h: prep[h], j: lastClosedIndex(prep[h], closeT, TFMS[h]),
      s4h: prep[h2], k: lastClosedIndex(prep[h2], closeT, TFMS[h2]),
      funding: meta.funding,
      tfb: b, tfh: h,
    };
    if (ctx.j < 0) continue;
    const sig = runStrategy(st, ctx, meta);
    if (sig) out.push({ ...sig, tf, barTime: base.candles[i].t, closeTime: closeT });
  }
  return out;
}

// Ré-ancre un signal sur le prix réellement disponible (entrée tardive). null si trop éloigné / invalidé.
export function reanchor(sig, price, strat) {
  const dir = sig.side === 'long' ? 1 : -1;
  const plannedRisk = Math.abs(sig.entry - sig.sl);
  const risk = dir * (price - sig.sl);
  if (!(risk > 0)) return null; // stop déjà franchi
  if (risk > 1.6 * plannedRisk || risk < 0.4 * plannedRisk) return null;
  return { ...sig, entry: price, tp1: price + dir * risk * strat.params.tp1R, tp2: price + dir * risk * strat.params.tp2R, riskPct: (risk / price) * 100 };
}

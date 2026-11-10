// Moteur de paper-trading : ouverture, suivi bougie par bougie, clôture.
// Règles (conservatrices) :
//  - entrée au prix du signal + slippage ; frais `feePct` par côté inclus dans le résultat en R
//  - si SL et TP touchés dans la même bougie => on suppose le SL d'abord
//  - TP1 : on sécurise 50 % et le stop passe au point d'entrée (break-even)
//  - TP2 : on clôture le reste ; stop temps : maxHoldHours
//  - option trailAtr : après TP1, stop suiveur à (extrême - trailAtr × ATR du signal)

export function openTrade(signal, { symbol, time, feePct, slipPct, maxHoldHours, trailAtr = 0 }) {
  const dir = signal.side === 'long' ? 1 : -1;
  const entry = signal.entry * (1 + dir * slipPct / 100);
  const risk = Math.abs(entry - signal.sl);
  return {
    id: `${symbol}-${signal.strategy}-${time}`,
    symbol,
    strategy: signal.strategy,
    version: signal.version,
    status: signal.status, // live | shadow (statut de la stratégie à l'ouverture)
    side: signal.side,
    score: signal.score,
    openTime: time,
    entry,
    sl: signal.sl,
    initialSl: signal.sl,
    tp1: signal.tp1,
    tp2: signal.tp2,
    risk,
    feeR: risk > 0 ? (2 * feePct / 100 * entry) / risk : 0,
    slipPct,
    maxHoldMs: maxHoldHours * 3600e3,
    trail: trailAtr > 0 && signal.atr > 0 ? trailAtr * signal.atr : 0, // stop suiveur (en prix) activé après TP1
    remaining: 1,
    realizedR: 0,
    tp1Hit: false,
    lastCheck: time,
    state: 'open',
    mfeR: 0,
    maeR: 0,
  };
}

function rOf(t, price) {
  const dir = t.side === 'long' ? 1 : -1;
  return (dir * (price - t.entry)) / t.risk;
}

function close(t, price, time, reason) {
  t.realizedR += t.remaining * rOf(t, price);
  t.remaining = 0;
  t.state = 'closed';
  t.closeTime = time;
  t.exitReason = reason;
  t.exitPrice = price;
  t.resultR = round(t.realizedR - t.feeR, 3);
  return t;
}

// Fait avancer le trade avec des bougies CLÔTURÉES (triées, durée `ms`, idéalement 1m) postérieures à lastCheck.
export function updateTrade(t, candles, ms) {
  if (t.state !== 'open') return t;
  const dir = t.side === 'long' ? 1 : -1;
  for (const c of candles) {
    if (c.t < t.lastCheck) continue; // déjà traitée ou commencée avant l'entrée (lastCheck initial = openTime)
    const fav = dir === 1 ? c.h : c.l;
    const adv = dir === 1 ? c.l : c.h;
    t.mfeR = Math.max(t.mfeR, rOf(t, fav));
    t.maeR = Math.min(t.maeR, rOf(t, adv));
    const slHit = dir === 1 ? c.l <= t.sl : c.h >= t.sl;
    if (slHit) { close(t, t.sl, c.t + ms, t.tp1Hit ? 'breakeven' : 'stop'); break; }
    if (!t.tp1Hit && (dir === 1 ? c.h >= t.tp1 : c.l <= t.tp1)) {
      t.realizedR += 0.5 * rOf(t, t.tp1);
      t.remaining = 0.5;
      t.tp1Hit = true;
      t.sl = t.entry; // break-even
    }
    if (dir === 1 ? c.h >= t.tp2 : c.l <= t.tp2) { close(t, t.tp2, c.t + ms, 'tp2'); break; }
    if (t.tp1Hit && t.trail > 0) {
      const trailSl = dir === 1 ? c.h - t.trail : c.l + t.trail;
      if (dir === 1 ? trailSl > t.sl : trailSl < t.sl) t.sl = trailSl; // appliqué à partir de la bougie suivante
    }
    t.lastCheck = c.t + ms;
    if (c.t + ms - t.openTime >= t.maxHoldMs) { close(t, c.c, c.t + ms, 'temps'); break; }
  }
  return t;
}

export function unrealizedR(t, price) {
  if (t.state !== 'open') return t.resultR;
  return round(t.realizedR + t.remaining * rOf(t, price) - t.feeR, 3);
}

function round(x, d) { const m = 10 ** d; return Math.round(x * m) / m; }

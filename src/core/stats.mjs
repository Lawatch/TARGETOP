// Statistiques de performance sur trades clôturés (en R).
export function computeStats(trades) {
  const closed = trades.filter((t) => t.state === 'closed').sort((a, b) => a.closeTime - b.closeTime);
  const n = closed.length;
  const rs = closed.map((t) => t.resultR);
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r <= 0);
  const sumW = wins.reduce((a, b) => a + b, 0);
  const sumL = -losses.reduce((a, b) => a + b, 0);
  let eq = 0, peak = 0, maxDd = 0;
  const curve = [];
  for (const t of closed) {
    eq += t.resultR; peak = Math.max(peak, eq); maxDd = Math.max(maxDd, peak - eq);
    curve.push([t.closeTime, round(eq)]);
  }
  const last20 = rs.slice(-20);
  return {
    trades: n,
    winRate: n ? round(wins.length / n) : null,
    expectancyR: n ? round(rs.reduce((a, b) => a + b, 0) / n) : null,
    totalR: round(eq),
    profitFactor: sumL > 0 ? round(sumW / sumL) : (sumW > 0 ? null : null),
    maxDrawdownR: round(maxDd),
    avgWinR: wins.length ? round(sumW / wins.length) : null,
    avgLossR: losses.length ? round(-sumL / losses.length) : null,
    last20ExpectancyR: last20.length ? round(last20.reduce((a, b) => a + b, 0) / last20.length) : null,
    curve,
  };
}

export function groupStats(trades, keyFn) {
  const groups = {};
  for (const t of trades) (groups[keyFn(t)] ??= []).push(t);
  const out = {};
  for (const [k, ts] of Object.entries(groups)) {
    const { curve, ...s } = computeStats(ts);
    out[k] = s;
  }
  return out;
}

function round(x) { return Math.round(x * 1000) / 1000; }

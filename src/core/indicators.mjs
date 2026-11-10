// Indicateurs techniques purs (causaux : la valeur à l'index i n'utilise que 0..i).
// Toutes les fonctions renvoient un tableau de même longueur que l'entrée (NaN si indisponible).

export function sma(values, period) {
  const out = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(NaN);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

// RSI de Wilder
export function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function trueRange(candles) {
  return candles.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const pc = candles[i - 1].c;
    return Math.max(c.h - c.l, Math.abs(c.h - pc), Math.abs(c.l - pc));
  });
}

// ATR de Wilder
export function atr(candles, period = 14) {
  const tr = trueRange(candles);
  const out = new Array(candles.length).fill(NaN);
  if (candles.length < period) return out;
  let prev = 0;
  for (let i = 0; i < period; i++) prev += tr[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < candles.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

export function stdev(values, period) {
  const out = new Array(values.length).fill(NaN);
  const m = sma(values, period);
  for (let i = period - 1; i < values.length; i++) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (values[j] - m[i]) ** 2;
    out[i] = Math.sqrt(s / period);
  }
  return out;
}

export function bollinger(closes, period = 20, mult = 2) {
  const mid = sma(closes, period);
  const sd = stdev(closes, period);
  return {
    mid,
    upper: mid.map((m, i) => m + mult * sd[i]),
    lower: mid.map((m, i) => m - mult * sd[i]),
  };
}

// Plus haut / plus bas des `period` bougies PRÉCÉDENTES (exclut la bougie courante).
export function donchianPrev(candles, period) {
  const hi = new Array(candles.length).fill(NaN);
  const lo = new Array(candles.length).fill(NaN);
  for (let i = period; i < candles.length; i++) {
    let h = -Infinity, l = Infinity;
    for (let j = i - period; j < i; j++) {
      if (candles[j].h > h) h = candles[j].h;
      if (candles[j].l < l) l = candles[j].l;
    }
    hi[i] = h; lo[i] = l;
  }
  return { hi, lo };
}

// ADX de Wilder
export function adx(candles, period = 14) {
  const n = candles.length;
  const out = new Array(n).fill(NaN);
  if (n < period * 2 + 1) return out;
  const tr = trueRange(candles);
  const pdm = new Array(n).fill(0), mdm = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    pdm[i] = up > down && up > 0 ? up : 0;
    mdm[i] = down > up && down > 0 ? down : 0;
  }
  let trS = 0, pS = 0, mS = 0;
  for (let i = 1; i <= period; i++) { trS += tr[i]; pS += pdm[i]; mS += mdm[i]; }
  const dx = new Array(n).fill(NaN);
  const calcDx = () => {
    const pdi = trS === 0 ? 0 : (100 * pS) / trS;
    const mdi = trS === 0 ? 0 : (100 * mS) / trS;
    return pdi + mdi === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / (pdi + mdi);
  };
  dx[period] = calcDx();
  for (let i = period + 1; i < n; i++) {
    trS = trS - trS / period + tr[i];
    pS = pS - pS / period + pdm[i];
    mS = mS - mS / period + mdm[i];
    dx[i] = calcDx();
  }
  let a = 0;
  for (let i = period; i < period * 2; i++) a += dx[i];
  a /= period;
  out[period * 2 - 1] = a;
  for (let i = period * 2; i < n; i++) {
    a = (a * (period - 1) + dx[i]) / period;
    out[i] = a;
  }
  return out;
}

// Agrège des bougies (ex: 1h -> 4h). `ms` = durée cible. Ne garde que les périodes complètes.
export function resample(candles, ms) {
  const out = [];
  let cur = null;
  for (const c of candles) {
    const bucket = Math.floor(c.t / ms) * ms;
    if (!cur || cur.t !== bucket) {
      if (cur) out.push(cur);
      cur = { t: bucket, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v, n: 1 };
    } else {
      cur.h = Math.max(cur.h, c.h);
      cur.l = Math.min(cur.l, c.l);
      cur.c = c.c;
      cur.v += c.v;
      cur.n++;
    }
  }
  if (cur) out.push(cur);
  if (!candles.length) return out;
  const srcMs = candles.length > 1 ? candles[1].t - candles[0].t : ms;
  const need = Math.round(ms / srcMs);
  return out.filter((c) => c.n >= need).map(({ n, ...c }) => c);
}

// Backtest walk-forward rapide sur l'historique Kraken Futures (sert au Stratège avant toute modif).
// Usage : node src/backtest.mjs [--days 30] [--symbols 20] [--strategies trend_pullback,breakout_volume] [--config path.json]
// Hypothèses : entrée à l'ouverture de la bougie 15m suivante, suivi sur bougies 15m (SL prioritaire si ambigu),
// frais + slippage identiques au live. Le funding n'est pas disponible => funding_squeeze ignoré.
import fs from 'node:fs';
import path from 'node:path';
import { fetchTickers, fetchCandles, mapLimit, TF_MS } from './kraken.mjs';
import { prepareSymbol, evaluateAt, MS15 } from './core/engine.mjs';
import { openTrade, updateTrade } from './core/trade.mjs';
import { computeStats, groupStats } from './core/stats.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const days = +arg('--days', 30);
const nSym = +arg('--symbols', 20);
const cfgPath = arg('--config', path.join(root, 'config/strategies.json'));
// --override '{"trend_pullback":{"tf":"1h","tp2R":4}}' : modifie des params sans toucher la config
const override = JSON.parse(arg('--override', '{}'));
const split = argv.includes('--split'); // affiche aussi 1re moitié / 2e moitié (stabilité)
const settings = JSON.parse(fs.readFileSync(path.join(root, 'config/settings.json'), 'utf8'));
// --fee / --slip : frais et slippage en % par côté (ex: --fee 0 pour un compte sans frais)
if (argv.includes('--fee')) settings.feePctPerSide = +arg('--fee');
if (argv.includes('--slip')) settings.slippagePctPerSide = +arg('--slip');
let strategies = JSON.parse(fs.readFileSync(cfgPath, 'utf8')).strategies.filter((s) => s.status !== 'disabled' && s.detector !== 'funding_squeeze');
const only = arg('--strategies', null);
if (only) strategies = strategies.filter((s) => only.split(',').includes(s.id));
strategies = strategies.map((s) => (override[s.id] ? { ...s, params: { ...s.params, ...override[s.id] } } : s));

const cacheDir = path.join(root, '.cache');
fs.mkdirSync(cacheDir, { recursive: true });
const now = Math.floor(Date.now() / 3600e3) * 3600e3; // arrondi à l'heure => cache réutilisable
async function cached(sym, tf, from) {
  const f = path.join(cacheDir, `${sym}_${tf}_${from}_${now}.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const cs = await fetchCandles(sym, tf, from, now, { now });
  fs.writeFileSync(f, JSON.stringify(cs));
  return cs;
}

const tickers = await fetchTickers();
const syms = tickers.filter((t) => t.tag === 'perpetual' && t.symbol.startsWith('PF_') && !t.suspended)
  .sort((a, b) => (b.volumeQuote || 0) - (a.volumeQuote || 0)).slice(0, nSym);
const warm = 250;
const from15 = now - (days * 96 + warm) * MS15;
const from1h = now - (days * 24 + warm) * 3600e3;

const trades = [];
const res = await mapLimit(syms, 4, async (t) => {
  const c15 = await cached(t.symbol, '15m', from15);
  const c1h = await cached(t.symbol, '1h', from1h);
  if (c15.length < warm + 100) return;
  const prep = prepareSymbol(c15, c1h);
  const openBy = {};
  const lastCloseBy = {};
  for (let i = warm; i < c15.length - 1; i++) {
    const bar = c15[i + 1];
    // suivi des trades ouverts avec la bougie i+1
    for (const [k, tr] of Object.entries(openBy)) {
      updateTrade(tr, [bar], MS15);
      if (tr.state === 'closed') { trades.push(tr); lastCloseBy[k] = tr.closeTime; delete openBy[k]; }
    }
    const sigs = evaluateAt(prep, c15[i].t + MS15, strategies, { volumeQuote: t.volumeQuote }, 'replay');
    for (const s of sigs) {
      const st = strategies.find((x) => x.id === s.strategy);
      if (st.status === 'live' && s.score < settings.minScoreLive) continue;
      if (openBy[s.strategy]) continue;
      if (bar.t - (lastCloseBy[s.strategy] || 0) < settings.cooldownBarsAfterClose * (st.params.tf === '1h' ? 4 : 1) * MS15) continue;
      const dir = s.side === 'long' ? 1 : -1;
      const entry = bar.o;
      const risk = dir * (entry - s.sl);
      if (!(risk > 0)) continue;
      const sig = { ...s, entry, tp1: entry + dir * risk * st.params.tp1R, tp2: entry + dir * risk * st.params.tp2R };
      const tr = openTrade(sig, { symbol: t.symbol, time: bar.t, feePct: settings.feePctPerSide, slipPct: settings.slippagePctPerSide, maxHoldHours: st.params.maxHoldHours, trailAtr: st.params.trailAtr || 0 });
      updateTrade(tr, [bar], MS15);
      if (tr.state === 'closed') { trades.push(tr); lastCloseBy[s.strategy] = tr.closeTime; } else openBy[s.strategy] = tr;
    }
  }
});
res.forEach((r, n) => { if (!r.ok) console.error('erreur', syms[n].symbol, r.error); });

const fmt = (o) => Object.entries(o).map(([k, v]) => `  ${k.padEnd(28)} n=${String(v.trades).padStart(4)}  win=${pct(v.winRate)}  exp=${num(v.expectancyR)}R  tot=${num(v.totalR)}R  PF=${num(v.profitFactor)}  maxDD=${num(v.maxDrawdownR)}R`).join('\n');
const pct = (x) => (x == null ? '  - ' : (x * 100).toFixed(0).padStart(3) + '%');
const num = (x) => (x == null ? '-' : x.toFixed(2));
console.log(`Backtest ${days}j, ${syms.length} symboles, ${trades.length} trades`);
console.log('Par stratégie :\n' + fmt(groupStats(trades, (t) => `${t.strategy}@v${t.version}`)));
console.log('Par sens :\n' + fmt(groupStats(trades, (t) => `${t.strategy}:${t.side}`)));
if (split) {
  const mid = now - (days / 2) * 86400e3;
  console.log('1re moitié :\n' + fmt(groupStats(trades.filter((t) => t.openTime < mid), (t) => `${t.strategy}@v${t.version}`)));
  console.log('2e moitié :\n' + fmt(groupStats(trades.filter((t) => t.openTime >= mid), (t) => `${t.strategy}@v${t.version}`)));
}
const { curve, ...g } = computeStats(trades);
console.log('Global :', JSON.stringify(g));
if (argv.includes('--json')) fs.writeFileSync(arg('--json', 'backtest.json'), JSON.stringify({ days, symbols: syms.map((s) => s.symbol), stats: groupStats(trades, (t) => t.strategy) }, null, 1));

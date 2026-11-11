// Scan live : lit Kraken Futures, détecte les opportunités, fait avancer le paper-trading,
// écrit data/state.json (pour le site), data/journal.json (tous les trades), data/health.json.
// Usage : node src/scan.mjs --data ./site/data
import fs from 'node:fs';
import path from 'node:path';
import { fetchTickers, fetchCandles, mapLimit, TF_MS } from './kraken.mjs';
import { prepareSymbol, prepareBtc4h, btcRegimeAt, evaluateAt, reanchor, MS15 } from './core/engine.mjs';
import { openTrade, updateTrade } from './core/trade.mjs';
import { computeStats, groupStats } from './core/stats.mjs';

const args = process.argv.slice(2);
const dataDir = args.includes('--data') ? args[args.indexOf('--data') + 1] : './site/data';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const readJson = (p, def) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; } };
const settings = readJson(path.join(root, 'config/settings.json'));
const stratCfg = readJson(path.join(root, 'config/strategies.json'));
const strategies = stratCfg.strategies.filter((s) => s.status !== 'disabled');
// « Affichées » = live (validées) + explore (exploration à risque réduit) : signaux du radar principal.
const SHOWN = new Set(['live', 'explore']);
const stratById = Object.fromEntries(stratCfg.strategies.map((s) => [s.id, s]));

fs.mkdirSync(dataDir, { recursive: true });
const P = (f) => path.join(dataDir, f);
const t0 = Date.now();
const now = t0;
const errors = [];

const prevState = readJson(P('state.json'), {});
const journal = readJson(P('journal.json'), { trades: [] });
const health = readJson(P('health.json'), { runs: [] });

// 1) Univers
const tickers = await fetchTickers();
const excluded = new Set(settings.universe.exclude || []);
const perps = tickers.filter((t) => t.tag === 'perpetual' && t.symbol.startsWith('PF_') && !t.suspended && !t.postOnly && !excluded.has(t.symbol));
const byVol = [...perps].sort((a, b) => (b.volumeQuote || 0) - (a.volumeQuote || 0));
const universe = byVol.filter((t) => (t.volumeQuote || 0) >= settings.universe.minVolumeQuoteUsd).slice(0, settings.universe.maxSymbols);
for (const s of settings.universe.always) if (!universe.find((u) => u.symbol === s)) { const t = perps.find((p) => p.symbol === s); if (t) universe.push(t); }
const tick = Object.fromEntries(perps.map((t) => [t.symbol, t]));
// Seuls les plus liquides peuvent produire des signaux live ; le reste nourrit le labo (shadow).
const liveSet = new Set([...universe.slice(0, settings.universe.liveMaxSymbols ?? universe.length).map((t) => t.symbol), ...settings.universe.always]);
const priceOf = (sym) => tick[sym]?.last ?? tick[sym]?.markPrice;

// 2) Détection
// Série BTC 4h partagée (filtre params.btcRegime) ; en cas d'échec, les stratégies filtrées BTC ne signalent rien.
let btc4h = null;
// ≥ 800 bougies 1h (= 200 bougies 4h) : le centile de volatilité (params.btcVolMinPct) a besoin de 120 bougies 4h d'historique.
const btcHist1h = Math.max(800, settings.historyCandles1h);
try { btc4h = prepareBtc4h(await fetchCandles('PF_XBTUSD', '1h', now - btcHist1h * TF_MS['1h'], now, { now })); }
catch (e) { errors.push(`PF_XBTUSD (régime BTC): ${e.message}`); }
const res = await mapLimit(universe, 5, async (t) => {
  const c15 = await fetchCandles(t.symbol, '15m', now - settings.historyCandles15m * TF_MS['15m'], now, { now });
  const c1h = await fetchCandles(t.symbol, '1h', now - settings.historyCandles1h * TF_MS['1h'], now, { now });
  if (c15.length < 80 || c1h.length < 80) return [];
  const prep = prepareSymbol(c15, c1h);
  const meta = { funding: t.relativeFundingRate, volumeQuote: t.volumeQuote, btc4h };
  return evaluateAt(prep, now, strategies, meta, 'live').map((s) => ({ ...s, symbol: t.symbol }));
});
const freshSignals = [];
res.forEach((r, n) => {
  if (!r.ok) return errors.push(`${universe[n].symbol}: ${r.error}`);
  freshSignals.push(...r.value.filter((s) => !SHOWN.has(stratById[s.strategy]?.status) || liveSet.has(s.symbol)));
});

// 3) Signaux actifs (frais + précédents encore valides)
const validMs = (s) => (settings.signalValidityMinutes[s.tf || '15m'] ?? 45) * 60e3;
const key = (s) => `${s.symbol}|${s.strategy}|${s.barTime}`;
const active = new Map();
for (const s of prevState.signals || []) if (now - s.closeTime < validMs(s) && stratById[s.strategy]?.status !== 'disabled') active.set(key(s), s);
for (const s of freshSignals) if (now - s.closeTime < validMs(s) && !active.has(key(s))) active.set(key(s), { ...s, firstSeen: now });
const signals = [...active.values()]
  .filter((s) => !SHOWN.has(stratById[s.strategy]?.status) || s.score >= settings.minScoreLive)
  .map((s) => ({ ...s, status: stratById[s.strategy]?.status ?? s.status, label: stratById[s.strategy]?.label, price: priceOf(s.symbol), change24h: tick[s.symbol]?.change24h, funding: tick[s.symbol]?.relativeFundingRate }))
  .sort((a, b) => b.score - a.score);

// 4) Paper-trading : suivi des trades ouverts (bougies 1m)
const open = journal.trades.filter((t) => t.state === 'open');
const upd = await mapLimit(open, 5, async (t) => {
  const cs = await fetchCandles(t.symbol, '1m', t.lastCheck, now, { now });
  updateTrade(t, cs, TF_MS['1m']);
});
upd.forEach((r, n) => { if (!r.ok) errors.push(`suivi ${open[n].symbol}: ${r.error}`); });

// 5) Paper-trading : ouverture des nouveaux trades (signaux frais uniquement, meilleurs scores d'abord).
// Plafond de corrélation : au plus `maxSameSideLiveSignals` trades live ouverts dans le même sens.
const opened = [];
for (const s of [...freshSignals].sort((a, b) => b.score - a.score)) {
  const strat = stratById[s.strategy];
  if (!strat || strat.status === 'disabled') continue;
  if (SHOWN.has(strat.status) && s.score < settings.minScoreLive) continue;
  const same = journal.trades.filter((t) => t.symbol === s.symbol && t.strategy === s.strategy);
  if (same.some((t) => t.state === 'open' || t.signalBarTime === s.barTime)) continue;
  const lastClose = Math.max(0, ...same.map((t) => t.closeTime || 0));
  if (now - lastClose < settings.cooldownBarsAfterClose * (strat.params.tf === '1h' ? 4 : 1) * MS15) continue;
  if (journal.trades.filter((t) => t.state === 'open' && t.strategy === s.strategy).length >= settings.maxOpenTradesPerStrategy) continue;
  if (SHOWN.has(strat.status) && journal.trades.filter((t) => t.state === 'open' && SHOWN.has(t.status) && t.side === s.side).length >= settings.maxSameSideLiveSignals) continue;
  const px = priceOf(s.symbol);
  const anchored = px ? reanchor(s, px, strat) : null;
  if (!anchored) continue;
  const tr = openTrade(anchored, { symbol: s.symbol, time: now, feePct: settings.feePctPerSide, slipPct: settings.slippagePctPerSide, maxHoldHours: strat.params.maxHoldHours, trailAtr: strat.params.trailAtr || 0 });
  tr.signalBarTime = s.barTime;
  tr.signalEntry = s.entry;
  tr.reasons = s.reasons;
  journal.trades.push(tr);
  opened.push(tr.id);
}

// 6) Statistiques
const all = journal.trades;
const liveTrades = all.filter((t) => SHOWN.has(t.status)); // tout ce qui est montré dans le radar principal
const stats = {
  live: computeStats(liveTrades),
  all: (({ curve, ...s }) => s)(computeStats(all)),
  byStrategy: groupStats(all, (t) => t.strategy),
  byStrategyVersion: groupStats(all, (t) => `${t.strategy}@v${t.version}`),
  bySide: groupStats(liveTrades, (t) => t.side),
  last7d: (({ curve, ...s }) => s)(computeStats(liveTrades.filter((t) => t.closeTime && now - t.closeTime < 7 * 86400e3))),
};

// 7) Radar marché
const movers = [...universe].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
const slim = (t) => ({ symbol: t.symbol, last: t.last, change24h: t.change24h, volumeQuote: t.volumeQuote, funding: t.relativeFundingRate, oi: t.openInterest });
const fundSorted = [...universe].filter((t) => Number.isFinite(t.relativeFundingRate)).sort((a, b) => b.relativeFundingRate - a.relativeFundingRate);
const market = {
  gainers: movers.slice(0, 6).map(slim),
  losers: movers.slice(-6).reverse().map(slim),
  fundingHigh: fundSorted.slice(0, 5).map(slim),
  fundingLow: fundSorted.slice(-5).reverse().map(slim),
  btc: tick.PF_XBTUSD ? slim(tick.PF_XBTUSD) : null,
  // { trend4h: 'up'|'down', volPct: 0..1|null, barTime } : un signal long avec trend4h 'down' (ou short avec 'up') est « contre BTC »
  btcRegime: btcRegimeAt(btc4h, now),
};

const durMs = Date.now() - t0;
const state = {
  generatedAt: now,
  scanDurationMs: durMs,
  universeSize: universe.length,
  errors: errors.slice(0, 20),
  settings: { minScoreLive: settings.minScoreLive, signalValidityMinutes: settings.signalValidityMinutes, feePctPerSide: settings.feePctPerSide, maxSameSideLiveSignals: settings.maxSameSideLiveSignals },
  strategies: stratCfg.strategies.map(({ id, label, version, status, params }) => ({ id, label, version, status, tp1R: params.tp1R, tp2R: params.tp2R, maxHoldHours: params.maxHoldHours })),
  signals,
  openTrades: all.filter((t) => t.state === 'open').map((t) => ({ ...t, price: priceOf(t.symbol) })),
  recentClosed: all.filter((t) => t.state === 'closed').sort((a, b) => b.closeTime - a.closeTime).slice(0, 40),
  // Trades radar (hors labo) clôturés depuis minuit UTC : la ligne « Aujourd'hui » du site ne doit pas dépendre
  // de recentClosed, tronqué à 40 trades (labo compris) et donc incomplet les jours chargés.
  todayClosed: all.filter((t) => t.state === 'closed' && t.status !== 'shadow' && t.closeTime >= now - (now % 86400000))
    .map(({ id, symbol, strategy, version, status, side, closeTime, resultR }) => ({ id, symbol, strategy, version, status, side, closeTime, resultR })),
  stats,
  market,
};

health.runs.push({ t: now, durMs, symbols: universe.length, errors: errors.length, fresh: freshSignals.length, opened: opened.length });
health.runs = health.runs.slice(-500);

fs.writeFileSync(P('state.json'), JSON.stringify(state));
fs.writeFileSync(P('journal.json'), JSON.stringify(journal));
fs.writeFileSync(P('health.json'), JSON.stringify(health));
console.log(`scan ok: ${universe.length} symboles, ${freshSignals.length} signaux frais, ${opened.length} trades ouverts, ${state.openTrades.length} en cours, ${errors.length} erreurs, ${durMs} ms`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));

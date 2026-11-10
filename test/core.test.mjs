import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ema, sma, rsi, atr, resample, donchianPrev } from '../src/core/indicators.mjs';
import { openTrade, updateTrade } from '../src/core/trade.mjs';
import { computeStats } from '../src/core/stats.mjs';
import { reanchor, prepareSymbol, evaluateAt } from '../src/core/engine.mjs';
import fs from 'node:fs';

const C = (t, o, h, l, c, v = 1) => ({ t, o, h, l, c, v });

test('sma / ema', () => {
  assert.deepEqual(sma([1, 2, 3, 4], 2).slice(1), [1.5, 2.5, 3.5]);
  const e = ema([1, 1, 1, 1, 1], 3);
  assert.equal(e[4], 1);
  assert.ok(Number.isNaN(e[1]));
});

test('rsi borne et monotone', () => {
  const up = Array.from({ length: 30 }, (_, i) => i);
  assert.equal(rsi(up, 14)[29], 100);
  const r = rsi(up.map((x) => (x % 2 ? x : x - 3)), 14);
  assert.ok(r[29] > 0 && r[29] < 100);
});

test('atr positif', () => {
  const cs = Array.from({ length: 20 }, (_, i) => C(i, 10, 11, 9, 10));
  assert.equal(atr(cs, 14)[19], 2);
});

test('donchianPrev exclut la bougie courante', () => {
  const cs = [C(0, 1, 2, 0, 1), C(1, 1, 3, 0, 1), C(2, 1, 10, 0, 1)];
  assert.equal(donchianPrev(cs, 2).hi[2], 3);
});

test('resample ne garde que les périodes complètes', () => {
  const H = 3600e3;
  const cs = Array.from({ length: 9 }, (_, i) => C(i * H, i, i + 1, i - 1, i + 0.5, 1));
  const r = resample(cs, 4 * H);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { t: 0, o: 0, h: 4, l: -1, c: 3.5, v: 4 });
});

const M = 60e3;
const sig = (side, entry, sl, tp1, tp2) => ({ side, entry, sl, tp1, tp2, strategy: 's', version: 1, status: 'live', score: 60, atr: 1 });
const opts = { symbol: 'X', time: 0, feePct: 0, slipPct: 0, maxHoldHours: 10 };

test('trade long : stop', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), opts);
  updateTrade(t, [C(0, 100, 100.5, 98.5, 99)], M);
  assert.equal(t.state, 'closed');
  assert.equal(t.resultR, -1);
});

test('trade long : TP1 puis break-even', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), opts);
  updateTrade(t, [C(0, 100, 101.6, 99.5, 101), C(M, 101, 101.2, 99.9, 100)], M);
  assert.equal(t.state, 'closed');
  assert.equal(t.exitReason, 'breakeven');
  assert.equal(t.resultR, 0.75);
});

test('trade short : TP2', () => {
  const t = openTrade(sig('short', 100, 101, 98.5, 97), opts);
  updateTrade(t, [C(0, 100, 100.2, 98.4, 98.6), C(M, 98.6, 98.7, 96.9, 97)], M);
  assert.equal(t.exitReason, 'tp2');
  assert.equal(t.resultR, 0.75 + 1.5);
});

test('SL prioritaire si SL et TP dans la même bougie', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), opts);
  updateTrade(t, [C(0, 100, 104, 98, 100)], M);
  assert.equal(t.exitReason, 'stop');
});

test('stop temps', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), { ...opts, maxHoldHours: 1 / 60 });
  updateTrade(t, [C(0, 100, 100.4, 99.8, 100.2)], M);
  assert.equal(t.exitReason, 'temps');
  assert.ok(Math.abs(t.resultR - 0.2) < 1e-9);
});

test('frais déduits en R', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), { ...opts, feePct: 0.05 });
  assert.ok(Math.abs(t.feeR - 0.1) < 1e-9);
});

test('les bougies antérieures à l\'entrée sont ignorées', () => {
  const t = openTrade(sig('long', 100, 99, 101.5, 103), { ...opts, time: 5 * M });
  updateTrade(t, [C(4 * M, 100, 100, 90, 95)], M);
  assert.equal(t.state, 'open');
});

test('stats', () => {
  const s = computeStats([{ state: 'closed', closeTime: 1, resultR: 2 }, { state: 'closed', closeTime: 2, resultR: -1 }, { state: 'open' }]);
  assert.equal(s.trades, 2);
  assert.equal(s.winRate, 0.5);
  assert.equal(s.expectancyR, 0.5);
  assert.equal(s.profitFactor, 2);
  assert.equal(s.maxDrawdownR, 1);
});

test('reanchor rejette un stop franchi ou un prix trop loin', () => {
  const st = { params: { tp1R: 1, tp2R: 2 } };
  assert.equal(reanchor(sig('long', 100, 99), 98.9, st), null);
  assert.equal(reanchor(sig('long', 100, 99), 102, st), null);
  const r = reanchor(sig('long', 100, 99), 100.2, st);
  assert.ok(Math.abs(r.tp1 - 101.4) < 1e-9);
});

test('toutes les stratégies de la config tournent sans erreur sur données synthétiques', () => {
  const cfg = JSON.parse(fs.readFileSync(new URL('../config/strategies.json', import.meta.url)));
  const H = 3600e3, Q = 900e3;
  let p = 100;
  const c15 = [], c1h = [];
  for (let i = 0; i < 1600; i++) { const o = p; p *= 1 + Math.sin(i / 40) * 0.003 + (i % 7 - 3) * 0.0008; c15.push(C(i * Q, o, Math.max(o, p) * 1.002, Math.min(o, p) * 0.998, p, 10 + (i % 13))); }
  for (let i = 0; i < 400; i++) { const g = c15.slice(i * 4, i * 4 + 4); c1h.push(C(i * H, g[0].o, Math.max(...g.map((x) => x.h)), Math.min(...g.map((x) => x.l)), g[3].c, 40)); }
  const prep = prepareSymbol(c15, c1h);
  let n = 0;
  for (let i = 300; i < 1600; i++) n += evaluateAt(prep, (i + 1) * Q, cfg.strategies, { funding: 0.0005 }, 'replay').length;
  assert.ok(n >= 0);
  for (const s of cfg.strategies) {
    assert.ok(['live', 'explore', 'shadow', 'disabled'].includes(s.status), s.id);
    assert.ok(Number.isInteger(s.version), s.id);
    assert.ok(s.params.tp2R >= s.params.tp1R, s.id);
  }
});

test('filtre de régime : "with" ne garde que les signaux dans le sens de la tendance de fond', async () => {
  const { DETECTORS, runStrategy } = await import('../src/core/strategies.mjs');
  DETECTORS.__fake = (ctx, p) => ({ side: p.side, entry: 100, sl: p.side === 'long' ? 99 : 101, quality: 0.5, reasons: [] });
  const s4h = { ema20: Array(60).fill(110), ema50: Array(60).fill(100) }; // tendance de fond haussière
  const ctx = { s15: { atr14: [1] }, i: 0, s4h, k: 59 };
  const mk = (side, regime) => ({ id: 'x', detector: '__fake', version: 1, status: 'shadow', params: { side, regime, tp1R: 1, tp2R: 2 } });
  assert.ok(runStrategy(mk('long', 'with'), ctx));
  assert.equal(runStrategy(mk('short', 'with'), ctx), null);
  assert.ok(runStrategy(mk('short', 'against'), ctx));
  assert.ok(runStrategy(mk('short', undefined), ctx));
  delete DETECTORS.__fake;
});

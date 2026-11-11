// TARGETOP — front-end sans dépendance. Lit data/state.json (généré par le scanner) et
// se connecte au WebSocket public Kraken Futures pour les prix en direct (si le réseau le permet).
'use strict';

const PRESETS = {
  prop: { capital: 5000, risk: 0.5, lev: 5, daily: 3, dd: 6 },
  funded: { capital: 5000, risk: 0.5, lev: 1, daily: 0, dd: 5 },
};
const LS_KEY = 'targetop.risk.v1';
const SHOWN = new Set(['live', 'explore']); // statuts affichés dans le radar principal
const riskMult = (s) => (s.status === 'explore' ? 0.5 : 1); // exploration = demi-risque
const REFRESH_MS = 60e3;
const WS_URL = 'wss://futures.kraken.com/ws/v1';

let state = null;
let risk = loadRisk();
const live = {};               // symbol -> prix live
let ws = null, wsOk = false, wsSubs = new Set();
let seenSignals = new Set(JSON.parse(sessionStorage.getItem('targetop.seen') || '[]'));
let alertsOn = localStorage.getItem('targetop.alerts') === '1';

const $ = (id) => document.getElementById(id);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sym = (s) => s.replace(/^PF_/, '').replace(/USD$/, '');
const px = (x) => (x == null || !isFinite(x) ? '–' : x >= 1000 ? x.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : x >= 1 ? x.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : x.toPrecision(4));
const pct = (x, d = 2) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : '') + x.toFixed(d) + ' %');
const r2 = (x) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : '') + x.toFixed(2) + 'R');
const ago = (t) => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''}` : `il y a ${Math.floor(m / 1440)} j`; };
const usd = (x) => (x == null || !isFinite(x) ? '–' : x.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: x < 100 ? 2 : 0 }));
const cls = (x) => (x > 0 ? 'pos' : x < 0 ? 'neg' : '');

// ---------- Réglages de risque ----------
function loadRisk() {
  try { const r = JSON.parse(localStorage.getItem(LS_KEY)); if (r && r.capital) return r; } catch {}
  return { preset: 'prop', ...PRESETS.prop };
}
function saveRisk() { localStorage.setItem(LS_KEY, JSON.stringify(risk)); renderRiskSummary(); renderAll(); }
function initRisk() {
  const map = { 'r-capital': 'capital', 'r-risk': 'risk', 'r-lev': 'lev', 'r-daily': 'daily', 'r-dd': 'dd' };
  $('r-preset').value = risk.preset || 'custom';
  for (const [id, k] of Object.entries(map)) {
    $(id).value = risk[k];
    $(id).addEventListener('input', () => { risk[k] = parseFloat($(id).value) || 0; risk.preset = 'custom'; $('r-preset').value = 'custom'; saveRisk(); });
  }
  $('r-preset').addEventListener('change', () => {
    const p = $('r-preset').value; risk.preset = p;
    if (PRESETS[p]) { Object.assign(risk, PRESETS[p], { capital: risk.capital || PRESETS[p].capital }); for (const [id, k] of Object.entries(map)) $(id).value = risk[k]; }
    saveRisk();
  });
  renderRiskSummary();
}
function renderRiskSummary() {
  const rUsd = risk.capital * risk.risk / 100;
  const perDay = risk.daily > 0 ? Math.floor(risk.daily / risk.risk) : null;
  $('risk-summary').textContent = `${usd(risk.capital)} · risque ${risk.risk}% = ${usd(rUsd)}/trade · levier max ${risk.lev}x` + (perDay ? ` · ${perDay} stops max/jour` : '');
}

// ---------- Données ----------
async function loadState() {
  try {
    const res = await fetch(`data/state.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const s = await res.json();
    const first = !state;
    state = s;
    for (const t of state.openTrades || []) if (t.price && !live[t.symbol]) live[t.symbol] = t.price;
    for (const sg of state.signals || []) if (sg.price && !live[sg.symbol]) live[sg.symbol] = sg.price;
    notifyNew(first);
    renderAll();
    syncWs();
  } catch (e) {
    $('pill-scan').className = 'pill bad';
    $('pill-scan').textContent = 'Données indisponibles';
  }
}
async function loadText(path, target) {
  try { const r = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' }); if (r.ok) $(target).innerHTML = md(await r.text()); } catch {}
}
function md(t) { // mini-markdown (titres, gras, listes, code)
  return esc(t).replace(/^### (.*)$/gm, '<b>$1</b>').replace(/^## (.*)$/gm, '<b style="font-size:15px">$1</b>').replace(/^# (.*)$/gm, '<b style="font-size:16px">$1</b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ---------- WebSocket prix live ----------
function wantedSymbols() {
  const s = new Set(['PF_XBTUSD']);
  for (const x of state?.signals || []) s.add(x.symbol);
  for (const x of state?.openTrades || []) s.add(x.symbol);
  return [...s];
}
function syncWs() {
  const want = wantedSymbols();
  if (!ws || ws.readyState > 1) return connectWs();
  if (ws.readyState !== 1) return;
  const add = want.filter((s) => !wsSubs.has(s));
  if (add.length) { ws.send(JSON.stringify({ event: 'subscribe', feed: 'ticker', product_ids: add })); add.forEach((s) => wsSubs.add(s)); }
}
function connectWs() {
  try { ws = new WebSocket(WS_URL); } catch { setWsPill(false); return; }
  wsSubs = new Set();
  const timeout = setTimeout(() => { if (!wsOk) setWsPill(false); }, 8000);
  ws.onopen = () => { syncWs(); };
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.feed === 'ticker' && m.product_id) {
      const p = m.markPrice ?? m.last ?? (m.bid && m.ask ? (m.bid + m.ask) / 2 : null);
      if (p) { live[m.product_id] = p; if (!wsOk) { wsOk = true; clearTimeout(timeout); setWsPill(true); } scheduleLiveRender(); }
    }
  };
  ws.onclose = () => { wsOk = false; setWsPill(false); setTimeout(connectWs, 15000); };
  ws.onerror = () => { try { ws.close(); } catch {} };
}
function setWsPill(ok) {
  $('pill-ws').className = 'pill ' + (ok ? 'ok' : 'warn');
  $('pill-ws').textContent = ok ? 'Prix live : connecté' : 'Prix live : bloqué (mode snapshot)';
  $('pill-ws').title = ok ? 'Prix temps réel via WebSocket Kraken' : 'Le réseau bloque le WebSocket Kraken : les prix sont ceux du dernier scan';
}
let liveTimer = null;
function scheduleLiveRender() { if (!liveTimer) liveTimer = setTimeout(() => { liveTimer = null; renderLive(); }, 1000); }

// ---------- Alertes ----------
function initAlerts() {
  const b = $('btn-alerts');
  const paint = () => { b.textContent = alertsOn ? '🔔 Alertes ON' : '🔕 Alertes'; b.className = 'pill btn ' + (alertsOn ? 'ok' : ''); };
  paint();
  b.onclick = async () => {
    alertsOn = !alertsOn;
    if (alertsOn && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch {} }
    localStorage.setItem('targetop.alerts', alertsOn ? '1' : '0');
    paint();
  };
}
function notifyNew(first) {
  const fresh = (state.signals || []).filter((s) => SHOWN.has(s.status) && !seenSignals.has(sigKey(s)));
  fresh.forEach((s) => seenSignals.add(sigKey(s)));
  sessionStorage.setItem('targetop.seen', JSON.stringify([...seenSignals].slice(-300)));
  if (first || !alertsOn || !fresh.length) return;
  beep();
  if ('Notification' in window && Notification.permission === 'granted') {
    for (const s of fresh.slice(0, 3)) new Notification(`${s.side === 'long' ? '🟢 LONG' : '🔴 SHORT'} ${sym(s.symbol)} · score ${s.score}`, { body: `${s.label} — entrée ${px(s.entry)} / stop ${px(s.sl)}` });
  }
  document.title = `(${fresh.length}) TARGETOP · Radar crypto`;
  setTimeout(() => (document.title = 'TARGETOP · Radar crypto'), 60e3);
}
function beep() { try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.08; o.start(); o.stop(a.currentTime + 0.25); } catch {} }
const sigKey = (s) => `${s.symbol}|${s.strategy}|${s.barTime}`;

// ---------- Rendu ----------
function reliability(stratId) {
  const s = state?.stats?.byStrategy?.[stratId];
  const n = s?.trades || 0;
  const st = (state?.strategies || []).find((x) => x.id === stratId)?.status;
  if (st === 'explore' && n < 30) return { cls: 'warn', txt: `🧪 Exploration : validée en backtest, à confirmer en live (${n}/30) · demi-risque` };
  if (n < 30) return { cls: 'info', txt: `Fiabilité : non prouvée (${n}/30 trades)` };
  if (s.expectancyR >= 0.1 && s.profitFactor >= 1.2) return { cls: 'ok', txt: `Fiable : ${r2(s.expectancyR)}/trade sur ${n}` };
  if (s.expectancyR > 0) return { cls: 'warn', txt: `Fragile : ${r2(s.expectancyR)}/trade sur ${n}` };
  return { cls: 'bad', txt: `Perdante : ${r2(s.expectancyR)}/trade sur ${n}` };
}

function liveStatus(s, price) {
  if (!price) return { cls: '', txt: '' };
  const dir = s.side === 'long' ? 1 : -1;
  const risk = Math.abs(s.entry - s.sl);
  const moveR = (dir * (price - s.entry)) / risk;
  if (dir * (price - s.sl) <= 0) return { cls: 'bad', txt: 'Invalidé (stop touché)', stale: true };
  if (dir * (price - s.tp1) >= 0) return { cls: 'bad', txt: 'Trop tard (TP1 atteint)', stale: true };
  if (moveR > 0.6) return { cls: 'warn', txt: `Parti (${moveR.toFixed(1)}R) : attendre un retour` };
  if (moveR < -0.6) return { cls: 'warn', txt: `Proche du stop (${moveR.toFixed(1)}R)` };
  return { cls: 'ok', txt: 'Dans la zone d\'entrée' };
}

function sizing(s, price) {
  const entry = price || s.entry;
  const dist = Math.abs(entry - s.sl);
  if (!(dist > 0)) return '';
  const rUsd = risk.capital * risk.risk / 100 * riskMult(s);
  const qty = rUsd / dist;
  const notional = qty * entry;
  const lev = notional / risk.capital;
  const warn = lev > risk.lev ? ` <span class="neg">⚠ levier ${lev.toFixed(1)}x > max ${risk.lev}x : réduis à ${usd(risk.capital * risk.lev)} (risque ${usd(risk.capital * risk.lev / entry * dist)})</span>` : '';
  return `Taille : <b>${qty >= 100 ? Math.round(qty).toLocaleString('fr-FR') : qty.toPrecision(3)} ${sym(s.symbol)}</b> ≈ ${usd(notional)} (levier ${lev < 0.1 ? '<0.1' : lev.toFixed(1)}x) · risque ${usd(rUsd)}${riskMult(s) < 1 ? ' (½ risque : exploration)' : ''}${warn}`;
}

// Un trade radar est-il déjà ouvert sur cet actif ? (évite de doubler la position ou de se contredire)
function already(s) {
  if (s.status === 'shadow') return '';
  const t = (state.openTrades || []).find((x) => x.status !== 'shadow' && x.symbol === s.symbol);
  if (!t) return '';
  if (t.side !== s.side) return `<div><span class="tag bad">⚠️ Un trade ${t.side === 'long' ? 'LONG' : 'SHORT'} est déjà ouvert sur ${esc(sym(s.symbol))} : signal contradictoire, abstiens-toi</span></div>`;
  const same = t.signalBarTime === s.barTime;
  return `<div><span class="tag info">📈 Déjà en cours (entrée ${px(t.entry)}, ${ago(t.openTime)})${same ? '' : ' : ne double pas la position'}</span></div>`;
}
function card(s, compact) {
  const price = live[s.symbol] ?? s.price;
  const st = liveStatus(s, price);
  const rel = reliability(s.strategy);
  const dir = s.side === 'long' ? 1 : -1;
  const d = (lvl) => pct(((lvl - s.entry) / s.entry) * 100, 2);
  const node = el(`<div class="card ${s.side} ${st.stale ? 'stale' : ''}" data-key="${esc(sigKey(s))}">
    <div class="card-head">
      <div><span class="side ${s.side}">${s.side === 'long' ? 'LONG' : 'SHORT'}</span><span class="sym">${esc(sym(s.symbol))}</span></div>
      <div><span class="score ${s.score >= 75 ? 'a' : ''}" title="Score qualité 0-100">${s.score}</span></div>
    </div>
    <div class="sub">${esc(s.label || s.strategy)} · ${esc(s.tf || '15m')} · v${s.version} · signal ${ago(s.closeTime)}</div>
    <div class="levels">
      <div><span>Entrée</span><b>${px(s.entry)}</b></div>
      <div class="lv-sl"><span>Stop ${d(s.sl)}</span><b>${px(s.sl)}</b></div>
      <div class="lv-tp"><span>TP1 ${d(s.tp1)}</span><b>${px(s.tp1)}</b></div>
      <div class="lv-tp"><span>TP2 ${d(s.tp2)}</span><b>${px(s.tp2)}</b></div>
    </div>
    <div class="live"><span>Prix : <b class="lp">${px(price)}</b> <span class="lpd ${cls(dir * (price - s.entry))}">${price ? pct(((price - s.entry) / s.entry) * 100) : ''}</span></span><span class="tag ${st.cls} lst">${esc(st.txt)}</span></div>
    <div><span class="tag ${rel.cls}">${esc(rel.txt)}</span></div>
    ${already(s)}
    ${compact ? '' : `<ul class="reasons">${(s.reasons || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`}
    <div class="size"><button class="copy">copier</button>${sizing(s, price)}</div>
  </div>`);
  node.querySelector('.copy').onclick = () => {
    const txt = `${s.side.toUpperCase()} ${sym(s.symbol)} (${s.label}) | entrée ${px(s.entry)} | stop ${px(s.sl)} | TP1 ${px(s.tp1)} (50%, puis stop au point d'entrée) | TP2 ${px(s.tp2)}`;
    navigator.clipboard?.writeText(txt).then(() => { node.querySelector('.copy').textContent = 'copié ✓'; });
  };
  return node;
}

function renderSignals() {
  const sigs = state.signals || [];
  const liveSigs = sigs.filter((s) => SHOWN.has(s.status));
  const lab = sigs.filter((s) => s.status === 'shadow');
  $('sig-count').textContent = liveSigs.length ? `${liveSigs.length} active(s)` : '';
  $('lab-count').textContent = `(${lab.length})`;
  const box = $('signals'); box.innerHTML = '';
  if (!liveSigs.length) box.appendChild(el(`<div class="empty">Aucune opportunité validée en ce moment. Le radar scanne ${state.universeSize} perpétuels toutes les ~10 min.<br>Pas de signal = pas de trade : c'est aussi une décision.</div>`));
  const nL = liveSigs.filter((s) => s.side === 'long').length, nS = liveSigs.length - nL;
  if (Math.max(nL, nS) >= 3) box.appendChild(el(`<div class="empty" style="grid-column:1/-1;text-align:left">⚠ ${Math.max(nL, nS)} signaux ${nS > nL ? 'SHORT' : 'LONG'} en même temps : ils sont très corrélés au BTC. Ne prends pas tout : choisis les 1 à 2 meilleurs scores (le paper-trading en ouvre au plus ${state.settings?.maxSameSideLiveSignals ?? 4} dans le même sens).</div>`));
  liveSigs.forEach((s) => box.appendChild(card(s)));
  const lb = $('lab'); lb.innerHTML = '';
  if (!lab.length) lb.appendChild(el('<div class="empty">Rien dans le labo pour l\'instant.</div>'));
  lab.forEach((s) => lb.appendChild(card(s, true)));
}

function tradeR(t) {
  const p = live[t.symbol] ?? t.price;
  if (!p) return null;
  const dir = t.side === 'long' ? 1 : -1;
  return t.realizedR + t.remaining * (dir * (p - t.entry)) / t.risk - t.feeR;
}

// Pire cas si tous les stops des trades radar sont touchés (en R de ton compte, exploration = ½ risque),
// comparé à la limite du challenge : perte max jour (Prop) ou perte max totale (Funded).
function riskLine(ts) {
  const atStop = (t) => { const dir = t.side === 'long' ? 1 : -1; return (t.realizedR + t.remaining * (dir * (t.sl - t.entry)) / t.risk - t.feeR) * riskMult(t); };
  const R = ts.reduce((a, t) => a + atStop(t), 0);
  const usdR = risk.capital * risk.risk / 100;
  const limPct = risk.daily > 0 ? risk.daily : risk.dd;
  const limName = risk.daily > 0 ? 'perte max jour' : 'perte max';
  const sides = new Set(ts.map((t) => t.side));
  const corr = ts.length > 1 && sides.size === 1 ? ` · ⚠️ ${ts.length} trades ${ts[0].side === 'long' ? 'LONG' : 'SHORT'} : ils bougent ensemble` : '';
  if (R >= 0) return `<div class="riskline ok">🛡️ Si tous les stops sont touchés : ${r2(R)} (${usd(R * usdR)}). Aucun risque de perte : stops au breakeven ou mieux${corr}.</div>`;
  const share = limPct > 0 ? (-R * usdR) / (risk.capital * limPct / 100) : null;
  const c = share == null ? 'warn' : share < 0.34 ? 'ok' : share < 0.67 ? 'warn' : 'bad';
  return `<div class="riskline ${c}">🛡️ Si tous les stops sont touchés : <b>${r2(R)}</b> sur ton compte (<b>${usd(R * usdR)}</b>)${share == null ? '' : `, soit <b>${Math.round(share * 100)} %</b> de ta ${limName} (${limPct} %)`}${corr}.</div>`;
}
function renderOpen() {
  const all = (state.openTrades || []).slice().sort((a, b) => b.openTime - a.openTime);
  const radar = all.filter((t) => t.status !== 'shadow'); // live + explore (+ anciens statuts) : ce que tu peux réellement trader
  const lab = all.filter((t) => t.status === 'shadow');
  $('open-count').textContent = all.length ? `(${radar.length} radar${lab.length ? ` · ${lab.length} labo` : ''})` : '';
  const table = (ts) => `<div class="tablewrap"><table class="opent"><thead><tr><th>Actif</th><th class="opt">Sens</th><th class="opt">Stratégie</th><th class="opt">Entrée</th><th>Stop</th><th class="opt">TP1</th><th class="opt">TP2</th><th>Prix</th><th>R live</th><th class="opt">Depuis</th></tr></thead><tbody>${ts.map((t) => {
    const r = tradeR(t);
    return `<tr data-sym="${esc(t.symbol)}" data-id="${esc(t.id)}"><td><b>${esc(sym(t.symbol))}</b> <span class="mside ${t.side}">${t.side === 'long' ? '▲ L' : '▼ S'}</span></td><td class="opt"><span class="side ${t.side}">${t.side === 'long' ? 'LONG' : 'SHORT'}</span></td><td class="opt">${esc(t.strategy)} ${t.status === 'shadow' ? '<span class="tag">labo</span>' : t.status === 'explore' ? '<span class="tag warn">🧪</span>' : ''}</td><td class="opt">${px(t.entry)}</td><td>${px(t.sl)}${t.tp1Hit ? ' <span class="tag ok">BE</span>' : ''}</td><td class="opt">${px(t.tp1)}</td><td class="opt">${px(t.tp2)}</td><td class="lp">${px(live[t.symbol] ?? t.price)}</td><td class="lr ${cls(r)}"><b>${r2(r)}</b></td><td class="opt">${ago(t.openTime)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
  const wasOpen = !!document.querySelector('#open details[open]'); // garder le tiroir ouvert au rafraîchissement
  const labR = lab.reduce((a, t) => a + (tradeR(t) || 0), 0);
  $('open').innerHTML = (radar.length ? table(radar) + riskLine(radar) : '<div class="empty">Aucun trade radar ouvert.</div>')
    + (lab.length ? `<details class="panel"${wasOpen ? ' open' : ''}><summary>🧪 ${lab.length} trade(s) labo en cours <span class="muted">(stratégies en test, à ne pas trader · ${r2(labR)} cumulés)</span></summary>${table(lab)}</details>` : '');
}

function statusTag(st) {
  const m = { live: ['ok', 'live'], explore: ['warn', '🧪 exploration'], shadow: ['info', 'labo'], disabled: ['bad', 'arrêtée'] }[st] || ['', st];
  return `<span class="tag ${m[0]}">${esc(m[1])}</span>`;
}

function renderPerf() {
  const st = state.stats || {};
  const L = st.live || {};
  const k = (label, v, c = '') => `<div class="kpi"><span>${label}</span><b class="${c}">${v}</b></div>`;
  $('kpis').innerHTML = [
    k('Trades clôturés (radar)', L.trades ?? 0),
    k('Taux de réussite', L.winRate == null ? '–' : Math.round(L.winRate * 100) + ' %'),
    k('Espérance / trade', r2(L.expectancyR), cls(L.expectancyR)),
    k('Total', r2(L.totalR), cls(L.totalR)),
    k('Profit factor', L.profitFactor == null || !isFinite(L.profitFactor) ? '–' : L.profitFactor.toFixed(2).replace('.', ',')),
    k('Drawdown max', !L.maxDrawdownR ? '0R' : '-' + L.maxDrawdownR.toFixed(2) + 'R'),
    k(`Équivalent compte (${risk.risk}%/trade)`, L.totalR == null ? '–' : pct(L.totalR * risk.risk, 1), cls(L.totalR)),
  ].join('');
  $('equity').innerHTML = sparkline(L.curve || []);
  const strats = state.strategies || [];
  const byV = st.byStrategyVersion || {};
  // Ce qui marche d'abord : stratégies du radar (live, explore) puis labo, triées par total R.
  const rank = { live: 0, explore: 1, shadow: 2, disabled: 3 };
  const pfTxt = (x) => (x == null || !isFinite(x) ? '–' : x.toFixed(2).replace('.', ','));
  const name = (label, ver, tag) => `<b>${esc(label)}</b> <span class="muted">${esc(ver)}</span><br>${tag}`;
  const rows = Object.entries(byV).map(([key, v]) => {
    const id = key.split('@')[0];
    const meta = strats.find((x) => x.id === id) || {};
    const isCur = meta.version && key.endsWith('@v' + meta.version);
    return { o: isCur ? rank[meta.status] ?? 4 : 5, t: v.totalR || 0, html: `<tr><td>${name(meta.label || id, key.split('@')[1], isCur ? statusTag(meta.status) : '<span class="tag">ancienne</span>')}</td><td>${v.trades}</td><td class="opt">${v.winRate == null ? '–' : Math.round(v.winRate * 100) + ' %'}</td><td class="${cls(v.expectancyR)}">${r2(v.expectancyR)}</td><td class="${cls(v.totalR)}"><b>${r2(v.totalR)}</b></td><td class="opt">${pfTxt(v.profitFactor)}</td><td class="opt">${!v.maxDrawdownR ? '0R' : '-' + v.maxDrawdownR.toFixed(2) + 'R'}</td></tr>` };
  });
  const noTrades = strats.filter((s) => !Object.keys(byV).some((k2) => k2.startsWith(s.id + '@'))).map((s) => ({ o: rank[s.status] ?? 4, t: -1e9, html: `<tr><td>${name(s.label, 'v' + s.version, statusTag(s.status))}</td><td colspan="6" class="muted">pas encore de trade clôturé</td></tr>` }));
  const all = [...rows, ...noTrades].sort((x, y) => x.o - y.o || y.t - x.t);
  $('perf').innerHTML = `<div class="tablewrap"><table class="perf"><thead><tr><th>Stratégie</th><th>Trades</th><th class="opt">Réussite</th><th>Espérance</th><th>Total</th><th class="opt">PF</th><th class="opt">DD max</th></tr></thead><tbody>${all.map((r) => r.html).join('')}</tbody></table></div>`;
  const cl = state.recentClosed || [];
  $('closed').innerHTML = cl.length ? `<div class="tablewrap"><table><thead><tr><th>Clôture</th><th>Actif</th><th>Sens</th><th>Stratégie</th><th>Sortie</th><th>Résultat</th></tr></thead><tbody>${cl.map((t) => `<tr><td>${ago(t.closeTime)}</td><td><b>${esc(sym(t.symbol))}</b></td><td><span class="side ${t.side}">${t.side === 'long' ? 'LONG' : 'SHORT'}</span></td><td>${esc(t.strategy)}@v${t.version}${t.status === 'shadow' ? ' <span class="tag">labo</span>' : ''}</td><td>${esc(t.exitReason)}</td><td class="${cls(t.resultR)}"><b>${r2(t.resultR)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Pas encore de trade clôturé.</div>';
}

function sparkline(curve) {
  if (curve.length < 2) return '<div class="empty small">La courbe de performance apparaîtra après quelques trades clôturés.</div>';
  const W = 1000, H = 120, pad = 8;
  const ys = [0, ...curve.map((c) => c[1])];
  const min = Math.min(...ys), max = Math.max(...ys);
  const x = (i) => pad + (i / (ys.length - 1)) * (W - 2 * pad);
  const y = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad);
  const pts = ys.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = ys[ys.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#334155" stroke-dasharray="4 4"/><polyline fill="none" stroke="${last >= 0 ? '#22c55e' : '#ef4444'}" stroke-width="2" points="${pts}"/></svg>`;
}

function renderMarket() {
  const m = state.market || {};
  const tbl = (title, rows, fmt) => `<div class="tablewrap"><table><thead><tr><th>${title}</th><th></th></tr></thead><tbody>${(rows || []).map((r) => `<tr><td><b>${esc(sym(r.symbol))}</b><span class="muted mpx">${px(r.last)}</span></td><td class="num">${fmt(r)}</td></tr>`).join('')}</tbody></table></div>`;
  const ch = (r) => `<span class="${cls(r.change24h)}">${pct(r.change24h)}</span>`;
  const fu = (r) => `<span class="${cls(r.funding)}">${(r.funding * 100).toFixed(3)}%/h</span>`;
  $('market').innerHTML = tbl('🚀 Top hausses 24h', m.gainers, ch) + tbl('🩸 Top baisses 24h', m.losers, ch) + tbl('🔥 Funding le plus haut (longs payent)', m.fundingHigh, fu) + tbl('🧊 Funding le plus bas (shorts payent)', m.fundingLow, fu);
}

const STALE_MS = 30 * 60e3; // au-delà, les données sont considérées en retard
function renderHeader() {
  const age = Date.now() - state.generatedAt;
  const p = $('pill-scan');
  p.className = 'pill ' + (age < 25 * 60e3 ? 'ok' : age < 90 * 60e3 ? 'warn' : 'bad');
  p.textContent = `Scan ${ago(state.generatedAt)} · ${state.universeSize} actifs`;
  p.title = state.errors?.length ? 'Erreurs : ' + state.errors.join(' | ') : 'Dernier scan sans erreur';
  // Bandeau explicite si le scan est en retard : les signaux affichés peuvent être périmés.
  const bn = $('stale-banner');
  bn.hidden = age < STALE_MS;
  if (!bn.hidden) bn.textContent = `⚠️ Dernier scan ${ago(state.generatedAt)} (${new Date(state.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}) : le radar est en retard, ces opportunités peuvent être périmées. Vérifie le prix sur Kraken avant d'entrer.`;
  const b = live.PF_XBTUSD ?? state.market?.btc?.last;
  $('pill-btc').innerHTML = `BTC ${px(b)} <span class="${cls(state.market?.btc?.change24h)}">${pct(state.market?.btc?.change24h)}</span>`;
}

function renderAll() {
  if (!state) return;
  renderHeader(); renderSignals(); renderOpen(); renderPerf(); renderMarket();
}

// Mise à jour légère quand un prix live arrive (sans tout reconstruire).
function renderLive() {
  if (!state) return;
  renderHeader();
  document.querySelectorAll('.card').forEach((node) => {
    const s = (state.signals || []).find((x) => sigKey(x) === node.dataset.key);
    if (!s) return;
    const price = live[s.symbol];
    if (!price) return;
    const dir = s.side === 'long' ? 1 : -1;
    node.querySelector('.lp').textContent = px(price);
    const d = node.querySelector('.lpd'); d.textContent = pct(((price - s.entry) / s.entry) * 100); d.className = 'lpd ' + cls(dir * (price - s.entry));
    const st = liveStatus(s, price); const t = node.querySelector('.lst'); t.textContent = st.txt; t.className = 'tag lst ' + st.cls;
    node.classList.toggle('stale', !!st.stale);
  });
  document.querySelectorAll('#open tr[data-id]').forEach((row) => {
    const t = (state.openTrades || []).find((x) => x.id === row.dataset.id);
    if (!t) return;
    const r = tradeR(t);
    row.querySelector('.lp').textContent = px(live[t.symbol]);
    const c = row.querySelector('.lr'); c.innerHTML = `<b>${r2(r)}</b>`; c.className = 'lr ' + cls(r);
  });
}

// ---------- Démarrage ----------
initRisk();
initAlerts();
loadState();
loadText('data/report.md', 'report');
loadText('data/strategy-log.md', 'stratlog');
fetch('data/version.json', { cache: 'no-store' }).then((r) => r.json()).then((v) => { $('version').textContent = `· build ${v.sha?.slice(0, 7) || ''} ${v.builtAt ? '· ' + new Date(v.builtAt).toLocaleString('fr-FR') : ''}`; }).catch(() => {});
setInterval(loadState, REFRESH_MS);
setInterval(() => { if (state) renderHeader(); }, 30e3);

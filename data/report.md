# Rapport des agents

## 2026-11-10 · Mise en place (session initiale)
- Radar en ligne : scan des 25 perpétuels les plus liquides de Kraken Futures toutes les ~10 min, signaux long/short avec entrée, stop, TP1, TP2 et taille de position selon ton compte challenge.
- Chaque signal est paper-tradé automatiquement (frais et slippage inclus) : la section Performance mesure la fiabilité **réelle**.
- Backtest initial honnête : les stratégies « classiques » en 15m perdaient (−0,28R/trade). Passage en 1h + nouvelle stratégie « faux breakout » (+0,12R/trade en backtest 90 j, positive sur les 2 moitiés de la période). Rien n'est prouvé tant qu'on n'a pas 30 trades live.
- Relais des agents : un passage d'expert par heure (Analyste → Stratège → Produit), chaque rôle toutes les 3 h.

## 🔎 Analyste · 2026-11-10 14h10 UTC (point santé)
- **Santé** : ✅ scan régulier : 32 runs, un toutes les ~7 min depuis 11:04 (aucun trou > 7 min), 0 erreur, dernier à 14:11 UTC. Le problème de cadence de 11 h est réglé.
- **Live** : 2 premiers trades clos, tous deux gagnants : `trend_pullback@1` short SOL **+1,39R** et XRP **+1,17R** (TP1 atteint, puis sortie au breakeven), soit **+2,56R** au total, 0 perte. 4 trades ouverts (XBT, HYPE avec TP1 déjà touché, ADA, DOGE). MAE max −0,32R.
- **Alerte Stratège** : 6/6 trades sont du `trend_pullback` short. Le risque est corrélé : un rebond BTC toucherait les 4 positions ouvertes en même temps (pire cas ≈ −3R sur la journée, sous la limite de 6R). 2 trades seulement : statistiquement non significatif, aucune décision possible.

## 🧠 Stratège · 2026-11-10 12h30 UTC
- **Live** : 0 trade clos (4 ouverts, tous `trend_pullback@1` short) → aucune décision de promotion. Aucune nouvelle version (v1 créées aujourd'hui, garde-fou 24 h).
- **Labo** : piste P1 `failed_breakout` (volume ≥ 1,5 et/ou stop + 0,5 ATR) testée sur 90 j / 25 symboles → rejetée : ces variantes n'améliorent que la 2e moitié (effet de régime probable). La v1 reste stable à +0,08R sur chaque moitié.
- **Reco** : Analyste → suivre la concentration 100 % short (corrélation). Prochain passage Stratège → filtre de régime BTC 4h (P1).

## 🛠️ Produit · 2026-11-10 13h50 UTC
- **Vu** : scan frais (13:46 UTC, 0 erreur), 3 opportunités actives, toutes SHORT. Aucun bug bloquant ; 0 erreur console sur desktop et mobile.
- **Fait** (1 changement visible) : un bandeau orange « radar en retard, opportunités peut-être périmées » s'affiche au-dessus des cartes dès que le dernier scan date de plus de 30 min (reco Analyste). Correctif d'affichage : « il y a 2 h 0 » devient « il y a 2 h », « 1 h 5 » devient « 1 h 05 ».
- **Reco** : Analyste → si le bandeau apparaît souvent, c'est que le cron décroche (P1 Fiabilité). Prochain Produit → filtre rapide actif/sens (P2) ou mini-graphique SVG (P2).

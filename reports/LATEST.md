# Rapport des agents

## 🧪 Mode exploration (10/11 fin d'après-midi)
- On teste plus d'idées, plus vite, avec une mise réduite : statut **Exploration** = dans le radar à **demi-risque**, coupé si < −0,20R après 15 trades, post-mortem par l'Analyste.
- En exploration : **Suivi de tendance (canal, long)** (+0,14R sur 180 j), Pullback de tendance, Faux breakout. Aucune stratégie n'est encore « live » à risque plein.
- 3 nouvelles familles en labo, et l'univers ne contient plus que des cryptos (actions tokenisées, or, pétrole exclus).

## 🚀 Sprint lancement 1er décembre (10/11 après-midi)
- Objectif inchangé : du profit. On accélère **l'apprentissage**, pas le risque. Plan et critères GO : `docs/LAUNCH_PLAN.md`.
- Testé et rejeté : passer en 15m (frais : −0,25R/trade), élargir le live aux petites alts (≈ 0R).
- Mis en place : labo élargi à 50 cryptos, variantes testées en parallèle, backtests sur 180 jours.
- ⚠️ Lecture honnête : sur 180 jours, aucune stratégie n'a encore d'avantage solide **avec frais**. Sans frais, l'avantage devient net : il faut confirmer les frais du challenge.

## 2026-11-10 · Mise en place (session initiale)
- Radar en ligne : scan des 25 perpétuels les plus liquides de Kraken Futures toutes les ~10 min, signaux long/short avec entrée, stop, TP1, TP2 et taille de position selon ton compte challenge.
- Chaque signal est paper-tradé automatiquement (frais et slippage inclus) : la section Performance mesure la fiabilité **réelle**.
- Backtest initial honnête : les stratégies « classiques » en 15m perdaient (−0,28R/trade). Passage en 1h + nouvelle stratégie « faux breakout » (+0,12R/trade en backtest 90 j, positive sur les 2 moitiés de la période). Rien n'est prouvé tant qu'on n'a pas 30 trades live.
- Relais des agents : un passage d'expert par heure (Analyste → Stratège → Produit), chaque rôle toutes les 3 h.

## 🔎 Analyste · 2026-11-10 17h10 UTC (point santé)
- **Santé** : ✅ 58 runs, un toutes les ~7 min (écart max 7 min depuis 11:04), 0 erreur, dernier à 17:04 UTC. Le bandeau « radar en retard » ne devrait pas apparaître.
- **Live** : 6 trades radar clos, **+4,77R** (5 gagnants, 1 perdant). `trend_pullback@1` short : 5/5 gagnants, **+5,77R**, toujours TP1 puis sortie au breakeven (MFE 1,6 à 2,5R, le TP2 à 8R n'est jamais atteint). `failed_breakout@1` long HYPE : −1R (stop, MFE 0). XBT reste ouvert (+0,73R acquis). Pire journée : +4,77R ; série de pertes max : 1. Labo (shadow) : 1 seul clos (`breakout_volume` long PEPE −1R), 12 ouverts presque tous short.
- **Alerte Stratège** : les 6 trades `trend_pullback` étaient tous des shorts dans le sens de BTC 4h (baissier), ce qui va dans le sens du filtre de régime mais ne le prouve pas (n = 6, un seul régime). Le seul perdant est le seul long. Exposition encore à ~95 % short : un rebond BTC coûterait cher au labo.

## 🧠 Stratège · 2026-11-10 15h30 UTC
- **Live** : 2 trades clos (+2,56R, `trend_pullback@1` short), 6 ouverts → < 30 trades, aucune décision. Aucune nouvelle version (garde-fou 24 h).
- **Labo** : filtre de régime BTC 4h (P1) analysé sur 90 j / 25 symboles. Pour `trend_pullback`, ne garder que les trades dans le sens de BTC 4h améliore l'espérance de +0,04R à +0,08R par trade (2e moitié +0,03R → +0,12R, 1re inchangée). Inutile pour `failed_breakout`, positif dans les deux régimes. `breakout_volume` est négatif partout.
- **Reco** : Analyste → classer les trades live selon la tendance BTC 4h. Prochain Stratège (≥ 11/11) → implémenter et vraiment backtester le filtre avant une éventuelle `trend_pullback` v2.

## 🛠️ Produit · 2026-11-10 13h50 UTC
- **Vu** : scan frais (13:46 UTC, 0 erreur), 3 opportunités actives, toutes SHORT. Aucun bug bloquant ; 0 erreur console sur desktop et mobile.
- **Fait** (1 changement visible) : un bandeau orange « radar en retard, opportunités peut-être périmées » s'affiche au-dessus des cartes dès que le dernier scan date de plus de 30 min (reco Analyste). Correctif d'affichage : « il y a 2 h 0 » devient « il y a 2 h », « 1 h 5 » devient « 1 h 05 ».
- **Reco** : Analyste → si le bandeau apparaît souvent, c'est que le cron décroche (P1 Fiabilité). Prochain Produit → filtre rapide actif/sens (P2) ou mini-graphique SVG (P2).

## 🛠️ Produit · 2026-11-10 17h UTC
- **Vu** : scan frais (16:43 UTC, 34 actifs, 0 erreur). 13 trades ouverts mais **1 seul du radar** (XBT `trend_pullback` short, +1,6R) : les 12 trades labo noyaient le seul trade à suivre. 0 signal radar, 12 labo. NVDAX/SPCXX en labo : ouverts à 16:01, juste avant l'exclusion des non-crypto (16:07). Ils se clôtureront normalement, ce n'est pas un bug.
- **Fait** (1 changement visible) : la section « Paper-trading en cours » ne montre plus que les trades radar ; les trades labo sont dans un tiroir replié (« 🧪 12 trade(s) labo en cours, à ne pas trader »), qui reste ouvert au rafraîchissement. Correctif : les colonnes funding du Radar marché étaient coupées sur desktop. Vérifié desktop + mobile, 0 erreur console, 16 tests OK.
- **Reco** : Analyste → rien de neuf côté front. Prochain Produit → P2 : expliquer l'encart « Opportunités » vide quand le labo a des signaux, puis filtre actif/sens.

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

## 🔎 Analyste · 2026-11-10 23h UTC (rapport complet : `reports/2026-11-10-23h-analyste.md`)
- **Santé** : ✅ 112 runs, un toutes les ~7 min (écart max 7 min depuis 11:04), 0 erreur, données fraîches (23:03 UTC).
- **Radar (net de frais)** : 7 clos, **+5,61R**. `trend_pullback@1` short 6/6 **+6,64R** (toujours TP1 puis breakeven, le TP2 à 8R n'est jamais touché, MFE moyen 1,95R) ; `failed_breakout@1` long −1,03R. Pire journée +5,61R, série de pertes max 1. Labo : `breakout_volume` **−1,97R sur 5** (PF 0,39), les autres familles ont < 2 trades clos.
- **Alerte Stratège** : (1) plus aucune stratégie n'est en `live` depuis 16:07 (radar en `explore`) : décider si on cumule les stats `live` et `explore` d'une même version ; (2) 26 trades ouverts sur 29 sont short (labo très corrélé) ; (3) tester un TP2 plus proche ou un trailing pour `trend_pullback`.

## 🧠 Stratège · 2026-11-11 00h30 UTC
- **Live** : radar +5,61R net (7 clos), aucune stratégie à 15 trades : pas de promotion ni de coupe. Statuts : les stats se cumulent par `id@version` (le passage `live` → `explore` ne change pas la version).
- **Labo** : sorties de `trend_pullback` testées sur 180 j. Rapprocher le TP2 (3R ou 4R) ne change rien. Un stop suiveur de 1 ATR aide un peu : −0,06R → −0,02R, et +0,01R avec le filtre BTC. La stratégie reste sans avantage démontré sur 180 j, donc **aucune v2** : on ne remet pas à zéro ses 6/6 live pour un gain marginal.
- **Reco** : Analyste → la concentration short du labo vient du régime BTC baissier, c'est attendu. Signaler si un rebond fait perdre plusieurs trades le même jour. Stratège (≥ 11/11 21h) → `donchian_trend` v2 (filtre de volatilité BTC) si le labo ne le dément pas.

## 🛠️ Produit · 2026-11-10 13h50 UTC
- **Vu** : scan frais (13:46 UTC, 0 erreur), 3 opportunités actives, toutes SHORT. Aucun bug bloquant ; 0 erreur console sur desktop et mobile.
- **Fait** (1 changement visible) : un bandeau orange « radar en retard, opportunités peut-être périmées » s'affiche au-dessus des cartes dès que le dernier scan date de plus de 30 min (reco Analyste). Correctif d'affichage : « il y a 2 h 0 » devient « il y a 2 h », « 1 h 5 » devient « 1 h 05 ».
- **Reco** : Analyste → si le bandeau apparaît souvent, c'est que le cron décroche (P1 Fiabilité). Prochain Produit → filtre rapide actif/sens (P2) ou mini-graphique SVG (P2).

## 🛠️ Produit · 2026-11-10 17h UTC
- **Vu** : scan frais (16:43 UTC, 34 actifs, 0 erreur). 13 trades ouverts mais **1 seul du radar** (XBT `trend_pullback` short, +1,6R) : les 12 trades labo noyaient le seul trade à suivre. 0 signal radar, 12 labo. NVDAX/SPCXX en labo : ouverts à 16:01, juste avant l'exclusion des non-crypto (16:07). Ils se clôtureront normalement, ce n'est pas un bug.
- **Fait** (1 changement visible) : la section « Paper-trading en cours » ne montre plus que les trades radar ; les trades labo sont dans un tiroir replié (« 🧪 12 trade(s) labo en cours, à ne pas trader »), qui reste ouvert au rafraîchissement. Correctif : les colonnes funding du Radar marché étaient coupées sur desktop. Vérifié desktop + mobile, 0 erreur console, 16 tests OK.
- **Reco** : Analyste → rien de neuf côté front. Prochain Produit → P2 : expliquer l'encart « Opportunités » vide quand le labo a des signaux, puis filtre actif/sens.

## 🛠️ Produit · 2026-11-10 20h UTC
- **Vu** : scan frais (19:44 UTC, 0 erreur), 0 signal, 0 trade radar ouvert (13 labo). Radar : 7 clos, +5,61R ; `trend_pullback` 6/6 (+6,64R). Aucun bug bloquant. Sur mobile, le tableau Performance cachait ses chiffres (seules les colonnes Stratégie et Statut étaient visibles, le reste était hors écran) et le PF s'affichait « 6.434 ».
- **Fait** (1 changement visible) : le tableau Performance place le statut sous le nom, masque Réussite/PF/DD sous 600 px et met **ce qui marche en tête** (stratégies du radar d'abord, puis tri par total R). PF au format « 6,43 ». Vérifié desktop + mobile, 0 erreur console, 18 tests OK.
- **Reco** : Analyste → rien côté front. Prochain Produit → filtre actif/sens (P2) quand il y aura des signaux, ou replier le Radar marché sur mobile (P3).

## 🛠️ Produit · 2026-11-10 23h UTC
- **Vu** : scan frais (22:46 UTC, 0 erreur). 4 trades radar ouverts, **tous `trend_pullback` short** (XLM, FET, TAO, AVAX, en `explore` donc demi-risque), 20 trades labo. Aucun bug ; les R affichés sont bien nets de frais (cohérent avec `resultR`, cf. échange Analyste/Stratège).
- **Fait** (1 changement visible) : sous les trades radar, une ligne 🛡️ affiche le **pire cas si tous les stops sont touchés**. Aujourd'hui : −2,07R = −52 $, soit 35 % de la perte max jour Prop (21 % de la perte max Funded). Elle signale aussi quand tous les trades sont dans le même sens. La couleur passe au vert, à l'orange puis au rouge selon la part de la limite consommée, et suit les réglages du compte. Vérifié desktop + mobile, 0 erreur console, 19 tests OK.
- **Reco** : Analyste → le chiffre « pire cas » peut servir au suivi de conformité challenge. Prochain Produit → P2 mobile : rendre « R live » visible sans défilement.

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

## 🔎 Analyste · 2026-11-10 20h10 UTC (point santé)
- **Santé** : ✅ 85 runs, un toutes les ~7 min (écart max 7 min depuis 11:04), 0 erreur, dernier à 20:03 UTC.
- **Live** : radar clos 7 trades, **+6,01R** : `trend_pullback@1` 6/6, **+7,01R** (XBT clos à +1,25R à 18:37, toujours TP1 puis breakeven) ; `failed_breakout@1` 0/1, −1R. 0 trade radar ouvert. Pire journée +6,01R, série de pertes max 1. Labo : `breakout_volume` 1/3 clos, −1,27R (seul labo négatif) ; `squeeze_breakout`, `failed_breakout_quick` et `trend_pullback_btc` ont 0 trade clos (13 ouverts au total).
- **Alerte Stratège** : rien de bloquant. Écart de mesure à vérifier : le Produit affiche +6,64R pour `trend_pullback`, le journal brut donne +7,01R (calcul des frais ?). `breakout_volume` confirme son espérance négative du backtest, candidat à l'abandon à 30 trades.

## 🧠 Stratège · 2026-11-10 18h30 UTC
- **Live** : 6 trades radar clos (+4,77R) → < 15 trades, aucune promotion ni coupe. Pas de nouvelle version des stratégies `explore` (garde-fou 24 h).
- **Fait** : nouveau filtre générique `params.btcRegime` (tendance BTC 4h, testé) et variante labo **`trend_pullback_btc`** (shadow). Sur 180 j, les `trend_pullback` contre BTC perdent dans les 4 trimestres. Le filtre améliore les 2 moitiés (−0,05R → −0,02R, drawdown 203R → 156R), sans atteindre le seuil `explore`. Pour info : `failed_breakout` + filtre BTC passe à +0,04R, drawdown 146R → 53R.
- **Reco** : Analyste → comparer `trend_pullback` et `trend_pullback_btc` en live. Prochain Stratège → volatilité BTC comme 2e filtre de régime, ou idée d'une autre famille (force relative vs BTC).

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

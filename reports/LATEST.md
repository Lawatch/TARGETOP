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

## 🔎 Analyste · 2026-11-11 08h10 UTC (point santé) · rapport complet précédent : `reports/2026-11-10-23h-analyste.md` (prochain à 11h)
- **Santé** : ✅ 195 runs, écart max 7 min, 0 erreur, dernier à 08:04 UTC.
- **Radar (net, id@version)** : inchangé depuis 05h. 10 clos, **+4,06R** ; `trend_pullback@1` 7/9 +5,09R, `failed_breakout@1` −1,03R. Pire jour 11/11 −1,55R (limite −6R ✅). 7 trades radar ouverts, dont **3 long** (premier rééquilibrage depuis le lancement).
- **Labo** : 5 clos depuis 05h, −2,24R (2 breakevens `failed_breakout_quick`). 11/11 cumulé : 15 clos, −12,84R. Pris note de ton diagnostic, Stratège : à partir du rapport de 11h, je comparerai chaque variante à sa stratégie radar sur la même période. Rien de neuf à signaler.

## 🧠 Stratège · 2026-11-11 09h30 UTC
- **Live** : radar +4,06R net (10 clos), aucune stratégie à 15 trades : pas de promotion ni de coupe, aucun paramètre modifié.
- **Labo** (P2) : **le score n'est pas calibré**. Sur 180 j de backtest, il n'y a aucune relation entre score et résultat, et les scores ≥ 80 font partie des pires (−0,08R en moyenne, négatifs sur les deux moitiés pour `failed_breakout`, `failed_breakout_quick` et `rsi2_pullback`).
- **Reco** : Produit → la mise en avant des « 3 meilleurs scores » n'a pas de base statistique. Classer plutôt par stratégie (meilleur historique live) puis par fraîcheur, et afficher le score discrètement (P1 du backlog). La règle de portefeuille P0 attend toujours la validation de l'utilisateur.

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

## 🛠️ Produit · 2026-11-11 02h UTC
- **Vu** : scan frais (01:46 UTC, 0 erreur). 4 opportunités radar (XBT, HYPE, XMR short ; PEPE long) et 5 trades radar ouverts (−2,66R = 44 % de la perte max jour si tous les stops sont touchés). **XBT et PEPE avaient déjà un trade ouvert** sans que la carte le dise : risque de doubler la position. Bugs : la case TP2 de PEPE débordait de la carte (micro-prix), et le levier s'affichait « 0.0x ».
- **Fait** (1 changement visible) : un tag « 📈 Déjà en cours (entrée, depuis) : ne double pas la position » apparaît sur la carte quand un trade radar est déjà ouvert sur l'actif ; si ce trade est en sens opposé, un tag ⚠️ « signal contradictoire, abstiens-toi » le remplace. Correctifs du débordement et du levier (« <0.1x »). Vérifié desktop + mobile, 0 erreur console, aucune carte qui déborde, 19 tests OK.
- **Reco** : Analyste → HYPE et XMR n'ont pas été ouverts en paper (plafond de 4 trades dans le même sens, à confirmer). Prochain Produit → P2 mobile : « R live » visible sans défilement.

## 🛠️ Produit · 2026-11-11 05h UTC
- **Vu** : scan frais (04:47 UTC, 0 erreur). 1 opportunité radar (ADA short), 5 trades radar ouverts (pire cas −1,85R = 31 % de la perte max jour), 29 labo. Aucun bug. Sur mobile, il fallait faire défiler le tableau des trades en cours pour voir « R live », la colonne la plus utile.
- **Fait** (1 changement visible) : sous 600 px, le tableau ne garde que Actif (avec ▲ L / ▼ S coloré), Stop, Prix et **R live**. Il tient sans défilement sur iPhone 13 comme sur SE, y compris avec les micro-prix (PEPE). Desktop inchangé. 0 erreur console, 19 tests OK.
- **En attente** : la règle de portefeuille P0 du Stratège (max 3 dans le même sens, stop jour −3R) attend la **validation de l'utilisateur** ; côté Produit, rien n'est implémenté avant. Si elle est validée : tag « plafond atteint, ne pas prendre » sur les cartes (le tag « Déjà en cours » et la ligne 🛡️ préparent le terrain).

## 🛠️ Produit · 2026-11-11 08h UTC
- **Vu** : scan frais (07:45 UTC, 0 erreur). **14 signaux radar SHORT en même temps** (tous `trend_pullback`, scores de 62 à 85), soit un mur de 14 cartes, alors que le site conseille d'en prendre 1 ou 2. 5 trades radar ouverts. Aucun bug, 0 erreur console.
- **Fait** (1 changement visible) : au-delà de 4 signaux, seuls les **3 meilleurs scores** (hors actifs déjà en cours) restent affichés ; les autres sont dans un tiroir « Voir les N autres signaux » (cartes compactes, prix live, tiroir gardé ouvert au rafraîchissement). Ce n'est que de l'affichage : le paper-trading et les règles ne changent pas. Vérifié desktop + mobile, 19 tests OK.
- **En attente** : la règle de portefeuille P0 attend toujours la validation de l'utilisateur. Ce passage-ci montrerait concrètement son effet : avec max 3 dans le même sens, 11 des 14 signaux seraient « ne pas prendre ».

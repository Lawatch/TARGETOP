# Journal des stratégies

## 2026-11-10 — v1 (mise en place)

Backtest de départ (Kraken Futures, frais 0,05 %/côté + slippage 0,02 %/côté, SL prioritaire si ambigu) :

| Variante | Univers | Résultat |
|---|---|---|
| Toutes stratégies en 15m | 45 j / 25 symboles | **−0,28R/trade** (2313 trades) : trop de bruit, frais trop lourds sur stops serrés |
| `trend_pullback` 15m → 1h | 45 j / 25 | −0,25R → −0,05R |
| `breakout_volume` 1h | 90 j / 25 | −0,25R : les cassures échouent souvent sur les alts |
| `failed_breakout` 1h (TP 1,5R/3R, 36 h) | 90 j / 25 | **+0,12R, PF 1,22**, positif sur les 2 moitiés (+0,09 / +0,15) |
| `trend_pullback` 1h + stop suiveur 2 ATR après TP1 | 90 j / 25 | +0,03R, PF 1,05 (≈ neutre) |
| Mêmes réglages, univers 40 symboles | 90 j / 40 | ≈ 0R : les alts peu liquides dégradent tout → univers limité au top 25 |

Décision :
- `live` : `failed_breakout` v1 (1h) et `trend_pullback` v1 (1h, stop suiveur), avec le badge « non prouvée » jusqu'à 30 trades live.
- `shadow` (labo) : `breakout_volume` (1h), `exhaustion_reversal` (1h), `funding_squeeze` (15m, pas de backtest possible faute d'historique de funding).

Lecture honnête : aucun avantage solide démontré à ce stade. Le paper-trading live tranchera.

## 2026-11-10 12h30 — Stratège : piste P1 `failed_breakout` (backtest seul, aucun changement)

Live : 4 trades ouverts (tous `trend_pullback@1` short), 0 clos → aucune décision live/shadow possible (< 30 trades).

Backtest 90 j / 25 symboles `--split`, `failed_breakout` seul :

| Variante | Trades | Exp. globale | PF | Max DD | 1re moitié | 2e moitié |
|---|---|---|---|---|---|---|
| v1 actuelle | 436 | +0,08R | 1,14 | 31,7R | +0,08R | +0,08R |
| stop mèche + 0,5 ATR (`slBufferAtr` 0,5) | 353 | +0,02R | 1,04 | 23,8R | −0,01R | +0,05R |
| volume plus strict (`minVolRatio` 1,5) | 345 | +0,08R | 1,13 | 27,9R | 0,00R | +0,15R |
| les deux | 267 | +0,10R | 1,18 | 18,7R | −0,04R | +0,22R |

Décision : **rien ne change**. Les variantes ne gagnent que sur la 2e moitié de la période, ce qui ressemble à un effet de régime et pas à un avantage robuste. La v1 reste la seule à être stable sur les 2 moitiés.
Note : sur la fenêtre glissante actuelle, la v1 donne +0,08R (contre +0,12R le 10/11 au matin), un avantage encore mince.

## 2026-11-10 15h30 — Stratège : piste P1 filtre de régime BTC 4h (backtest seul, aucun changement)

Live : 2 trades clos (`trend_pullback@1` short, +2,56R), 6 ouverts → toujours < 30 trades, aucune décision live/shadow.

Méthode : backtest 90 j / 25 symboles (toutes stratégies), puis chaque trade est classé selon la tendance BTC 4h à l'ouverture (EMA20 vs EMA50 de PF_XBTUSD en 4h). « Aligné » = long quand BTC 4h haussier, short quand BTC 4h baissier. C'est une approximation a posteriori : un vrai filtre libérerait des créneaux et changerait un peu la séquence des trades.

| Stratégie | Sous-ensemble | Trades | Exp. | PF | 1re moitié | 2e moitié |
|---|---|---|---|---|---|---|
| `trend_pullback` | tous | 838 | +0,04R | 1,07 | +0,05R | +0,03R |
| `trend_pullback` | aligné BTC | 687 | **+0,08R** | 1,14 | +0,05R | **+0,12R** |
| `trend_pullback` | contre BTC | 151 | −0,16R | 0,77 | +0,06R | −0,43R |
| `failed_breakout` | tous | 443 | +0,13R | 1,22 | +0,06R | +0,19R |
| `failed_breakout` | aligné BTC | 180 | +0,16R | 1,27 | +0,10R | +0,22R |
| `failed_breakout` | contre BTC | 263 | +0,10R | 1,19 | +0,04R | +0,17R |

Lecture :
- `trend_pullback` : le filtre ne change rien sur la 1re moitié (+0,05R) et améliore la 2e (+0,03R → +0,12R) en coupant une queue perdante (contre-tendance BTC : −0,43R/trade sur la 2e moitié). C'est le cas « ne nuit pas sur une moitié, aide nettement sur l'autre », donc un **candidat pour `trend_pullback` v2**. Le drawdown reste toutefois élevé (≈ 50R sur 90 j, 25 symboles).
- `failed_breakout` : positif dans les deux régimes, donc **pas de filtre** (c'est une stratégie de retournement, sa diversité de sens est un atout).
- `breakout_volume` (shadow) : négatif dans presque tous les régimes (−0,15R puis −0,33R par moitié). Candidat à `disabled`.

Décision : **rien ne change aujourd'hui**, car `trend_pullback` v1 date du 10/11 (garde-fou de 24 h). Prochaine étape, à partir du 11/11 : implémenter le filtre BTC 4h dans `src/core`, avec un test, puis refaire un backtest réel (et non a posteriori) avant toute v2.

## 2026-11-10 (après-midi) — Accélération avant le lancement du 1/12

Tests demandés (le boss trouve que ça ne va pas assez vite) :
- 15m (court terme), 90 j/25 : `failed_breakout` −0,25R, `trend_pullback` −0,17R → **rejeté** (frais). Sans frais : −0,04R / +0,02R.
- 50 symboles, 90 j : ≈ +0,01R pour les deux → **rejeté pour le live**, gardé pour le labo.
- 180 j / 25 : `failed_breakout` 0,00R (−0,14 / +0,14), `trend_pullback` −0,06R → l'avantage observé sur 90 j **n'est pas robuste**.
- Filtre de régime « dans le sens de la tendance 4h » sur `failed_breakout`, 180 j/25 : **+0,09R, PF 1,16** (−0,04 / +0,21).
- Frais 0, 1h, 90 j/25 : `failed_breakout` +0,23R (PF 1,47), `trend_pullback` +0,12R → la structure de frais du challenge est décisive.

Décisions :
- Ajout du filtre générique `params.regime` (`with` / `against`), testé.
- Nouvelles variantes **shadow** : `failed_breakout_regime` (filtre tendance) et `failed_breakout_quick` (TP 1R/2R, 24 h).
- Univers : 50 perps scannés (labo), live limité au top 25.
- Les 2 stratégies live restent live (exception de démarrage), badge « non prouvée ».

## 2026-11-10 (fin d'après-midi) — Mode exploration

Décision utilisateur : accepter un peu de risque pour découvrir plus vite. Nouveau statut **`explore`** (radar, demi-risque).
- Univers nettoyé : exclusion des actions tokenisées / matières premières (AMZNX, NVDAX, XAU, WTIOIL, NATGAS…).
- 3 nouvelles familles en labo : `squeeze_breakout` (−0,15R), `rsi2_pullback` (−0,08R), `donchian_trend`.
- `donchian_trend` (long seulement, 1h, stop 2,5 ATR, suiveur 3 ATR après TP1 2R) — 180 j / 25 cryptos : **+0,14R, PF 1,23** (−0,01 / +0,25) → **`explore`**.
- `trend_pullback` (−0,06R) et `failed_breakout` (−0,05R) sur 180 j / 25 cryptos : **`live` → `explore`** (demi-risque). Aucune stratégie n'est `live` tant qu'elle n'a pas prouvé un avantage en réel. Coupe automatique si < −0,20R après 15 trades.
- Ajout des filtres génériques `params.sides` (long/short) et `params.regime` (with/against).

## 2026-11-10 18h30 — Stratège : filtre de régime BTC 4h (`params.btcRegime`) + variante shadow `trend_pullback_btc`

Live : 6 trades radar clos (+4,77R), dont `trend_pullback@1` 5/5 gagnants, tous des shorts dans le sens de BTC 4h → < 15 trades, aucune décision de cycle de vie.

Constats (180 j / 25 cryptos, standard du sprint) :
- Le filtre existant `regime: "with"` (tendance 4h **du symbole**) ne change **rien** pour `trend_pullback` en 1h (résultats identiques) : le détecteur exige déjà EMA20 > EMA50 sur son TF supérieur (4h).
- Classement des trades `trend_pullback` selon la tendance **BTC** 4h : les trades contre BTC perdent **dans les 4 trimestres** (−0,15 / −0,19 / −0,22 / −0,20R, n = 335). C'est le signal le plus stable trouvé jusqu'ici.
- Nouveau filtre générique `params.btcRegime` (`with` / `against`, tendance EMA20/EMA50 de PF_XBTUSD en 4h, sans biais d'anticipation, testé). Vrai backtest :

| Stratégie | Variante | Trades | Exp. | PF | Max DD | 1re moitié | 2e moitié |
|---|---|---|---|---|---|---|---|
| `trend_pullback` | v1 | 1836 | −0,05R | 0,92 | 203R | −0,14R | +0,05R |
| `trend_pullback` | + `btcRegime: with` | 1527 | −0,02R | 0,97 | 156R | −0,13R | +0,09R |
| `failed_breakout` | v1 | 1173 | −0,05R | 0,92 | 146R | −0,20R | +0,10R |
| `failed_breakout` | + `btcRegime: with` | 524 | +0,04R | 1,07 | 53R | −0,04R | +0,14R |

Décisions :
- Ajout de **`trend_pullback_btc` en `shadow`** (mêmes paramètres que `trend_pullback` v1 + `btcRegime: "with"`). Le filtre améliore les deux moitiés mais reste sous les critères `explore` : à prouver en labo.
- `failed_breakout` + filtre BTC : nette baisse du drawdown (146R → 53R) mais 1re moitié encore négative, et le labo a déjà `failed_breakout_regime` (tendance du symbole, +0,09R). Pas de variante en plus (labo à 11 actives).
- Rien ne change pour les stratégies `explore` (garde-fou 24 h et données live insuffisantes).
- Lecture honnête : sur 180 j, aucune variante de ces deux familles n'atteint +0,08R. Le filtre BTC réduit les pertes, il ne crée pas d'avantage.

## 2026-11-10 21h30 — Stratège : filtre de volatilité BTC (`params.btcVolMinPct`) + variante shadow `donchian_trend_vol`

Live : radar 7 trades clos (+6,64R net de frais), labo < 15 trades par stratégie → aucune décision de cycle de vie.
Mesure : l'écart +7,01R / +6,64R vient de `realizedR` (brut) vs `resultR` (**net de frais**, le bon chiffre).

Analyse (180 j / 25 cryptos, tous les trades classés selon le rang centile de l'ATR 4h relatif de BTC sur ~20 j) :

| Stratégie | BTC calme (< 33 %) | moyen | agité (≥ 67 %) |
|---|---|---|---|
| `donchian_trend` | −0,15R (−0,14 / −0,17) | +0,14R (+0,05 / +0,20) | **+0,54R** (+0,11 / +0,64) |
| `trend_pullback` | −0,15R (−0,30 / +0,04) | −0,09R | +0,06R (+0,02 / +0,10) |
| `failed_breakout` | −0,04R | −0,04R | −0,06R (aucun lien) |
| `rsi2_pullback` | −0,07R | −0,08R | −0,03R (aucun lien) |

→ Le suivi de tendance a besoin de volatilité : en marché calme, ses cassures échouent (logique et stable sur les 2 moitiés). Les stratégies de retournement n'y sont pas sensibles.

Nouveau filtre générique `params.btcVolMinPct` (testé). Vrai backtest `donchian_trend` :

| Variante | Trades | Exp. | PF | Max DD | 1re moitié | 2e moitié |
|---|---|---|---|---|---|---|
| v1 | 520 | +0,16R | 1,25 | 39,7R | +0,02R | +0,25R |
| + `btcVolMinPct: 0.33` | 332 | **+0,31R** | 1,55 | 26,3R | +0,06R | +0,43R |
| + `btcVolMinPct: 0.5` (pour info) | 246 | +0,38R | 1,70 | 31,1R | +0,21R | +0,43R |

Décision : **`donchian_trend_vol` en `shadow`** (v1 + `btcVolMinPct: 0.33`, seuil « naturel », sans chercher l'optimum à 0,5). `donchian_trend` v1 (`explore`) date d'aujourd'hui : pas de v2 avant le 11/11 21h. Si le labo confirme, la v2 sera candidate. Réserve : la 1re moitié ne compte que 108 trades, et `donchian_trend` est long seulement (biais de marché haussier possible).

## 2026-11-11 00h30 — Stratège : sorties de `trend_pullback` (backtest seul, aucun changement)

Live : radar 7 clos (+5,61R net), `trend_pullback@1` 6/6 (+6,64R) mais TP2 à 8R jamais touché. Aucune stratégie n'a 15 trades : pas de décision de cycle de vie.

Question de l'Analyste : un TP2 plus proche ou un stop suiveur plus serré aideraient-ils ? Backtest 180 j / 25 cryptos :

| Variante `trend_pullback` | Trades | Exp. | PF | Max DD | 1re moitié | 2e moitié |
|---|---|---|---|---|---|---|
| v1 (TP2 8R, suiveur 2 ATR) | 1856 | −0,06R | 0,91 | 222R | −0,14R | +0,04R |
| TP2 3R, sans suiveur | 1689 | −0,06R | 0,90 | 215R | – | – |
| TP2 4R | 1857 | −0,06R | 0,91 | 223R | – | – |
| TP1 à 1R | 2062 | −0,07R | 0,86 | 245R | – | – |
| suiveur 3 ATR | 1707 | −0,07R | 0,89 | 240R | – | – |
| suiveur 1,5 ATR | 1906 | −0,05R | 0,93 | 203R | −0,12R | +0,04R |
| **suiveur 1 ATR** | 1940 | −0,02R | 0,97 | 192R | −0,10R | +0,06R |
| `trend_pullback_btc` (filtre BTC) | 1535 | −0,03R | 0,96 | 175R | −0,14R | +0,07R |
| `trend_pullback_btc` + suiveur 1 ATR | 1603 | +0,01R | 1,02 | 140R | −0,09R | +0,10R |

Lecture : la cible TP2 n'a aucun effet. Le suiveur 1 ATR protège mieux le gain après TP1 et améliore un peu les 2 moitiés, mais la stratégie reste ≈ 0R sur 180 j : la 1re moitié est perdante quoi qu'on fasse. Les 6 gains live viennent d'un seul régime (BTC baissier).

Décision : **rien ne change**. Une v2 remettrait à zéro les stats live (6/6) pour un gain marginal. Si `trend_pullback` doit avoir une v2 (après le 11/11 ~10h), la piste retenue est « filtre BTC + suiveur 1 ATR », à valider en labo d'abord.

Réponse à l'Analyste sur les statuts : les stats se comptent par **`id@version`**. Passer de `live` à `explore` ne change pas la version, donc les trades `live` et `explore` d'une même version se cumulent (règle d'AGENTS.md).

## 2026-11-11 03h30 — Stratège : risque corrélé et pire journée (analyse de portefeuille, aucun changement de stratégie)

Contexte : un rebond entre 23h et 02h a déclenché 8 stops short en 3 h (`trend_pullback_btc` 0/4 −4,27R, `squeeze_breakout` −2R, AVAX `trend_pullback` −1R). Radar cumulé : +4,58R net. Aucune stratégie n'a 15 trades : pas de promotion ni de coupe.

Question : quel est le vrai risque journalier du radar par rapport à la limite du challenge (−3 %/jour = **−6R** à 0,5 %/trade) ? Simulation sur les trades du backtest 180 j / 25 cryptos (`trend_pullback` + `failed_breakout` + `donchian_trend`), dans l'ordre chronologique, avec des règles de portefeuille :

| Règle | Trades | Exp. (1re / 2e moitié) | Max DD | Pire jour | Jours ≤ −6R / 180 |
|---|---|---|---|---|---|
| Aucune (risque plein) | 3533 | −0,02R (−0,14 / +0,10) | 273R | **−25,0R** | **57** |
| Stop jour −3R | 2556 | +0,01R (−0,16 / +0,14) | 187R | −17,3R | 32 |
| Max 3 positions même sens | 1372 | −0,08R | 126R | −10,8R | 16 |
| **Max 3 même sens + stop jour −3R** | 1223 | −0,05R (−0,16 / +0,07) | 113R | **−7,0R** | **2** |
| Idem à demi-risque (`explore`) | 1223 | idem | 57R | **−3,5R** | **0** |
| Aucune règle, demi-risque | 3533 | idem | 137R | −12,5R | 15 |

Lecture :
- **Prendre tous les signaux radar tuerait le challenge**, même à demi-risque (15 jours sous −6R en 180 j). Le danger, c'est la corrélation (tous les alts bougent avec BTC), pas une stratégie en particulier.
- Plafond de positions et stop journalier **ne créent pas d'avantage** (l'espérance bouge peu) mais divisent le pire jour par 3 à 7. C'est une condition de survie, pas une optimisation.
- Le filtre BTC 4h ne protège pas d'un rebond brutal intrajournalier (il réagit en heures, le rebond a duré 3 h).

Décision : aucune stratégie modifiée. **Règle de portefeuille proposée en P0** pour le lancement (backlog + plan) : max 3 positions radar dans le même sens, plus d'entrée après −3R réalisés dans la journée. À valider par l'utilisateur, puis à implémenter (Produit : affichage « ne pas prendre » sur les cartes ; scan : appliquer la même règle au paper-trading radar pour que les stats live la reflètent).

## 2026-11-11 06h30 — Stratège : diagnostic `trend_pullback_btc` 0/6 vs `trend_pullback` 7/9 (aucun changement)

Alerte de l'Analyste : la variante filtrée par BTC fait bien pire que la version sans filtre, alors qu'elle n'en garde en théorie qu'une partie des signaux. Vérification trade par trade (journal `gh-pages`) : **pas de bug**, la comparaison est biaisée :
1. **Période** : les 7 gains de `trend_pullback` ont été ouverts le 10/11 entre 09h53 et 14h04, **avant la création** de `trend_pullback_btc` (18h30). Sur la période commune (depuis le 10/11 20h) : `trend_pullback` 3 clos, **−1,54R** (AVAX −1,03, FET −1,03, XBT +0,52) contre `trend_pullback_btc` 6 clos, −6,38R.
2. **Univers** : le labo scanne 50 cryptos, le radar seulement le top 25. 3 des 6 pertes de la variante (NEAR, ENA, XMR) n'ont aucun trade radar sur la même période, signe qu'elles sont probablement hors du top 25. C'est la leçon déjà connue : les alts moins liquides dégradent tout.
3. Les deux versions ont subi le même rebond de 23h-03h (stops AVAX et FET identiques). Le filtre BTC 4h ne protège pas d'un rebond de quelques heures, ce qui était attendu (STRATEGY_LOG 11/11 03h30).

Conclusion : aucune preuve que le filtre BTC soit nuisible, ni utile, sur 6 trades. Pour comparer à l'avenir une variante labo avec la stratégie radar, il faut se limiter à la **même période et aux mêmes symboles**.

Décision : rien ne change (aucune stratégie à 15 trades). `trend_pullback` v1 aura 24 h vers 10h : pas de v2 prévue (STRATEGY_LOG 11/11 00h30).

## 2026-11-11 09h30 — Stratège : calibration du score (backtest seul, aucun changement de stratégie)

Live : radar +4,06R net (10 clos, inchangé depuis 05h), aucune stratégie à 15 trades : pas de promotion ni de coupe.

Piste P2 du backlog : les scores élevés gagnent-ils plus ? Trades du backtest 180 j / 25 cryptos, espérance par tranche de score (1re / 2e moitié) :

| Score | < 60 | 60-64 | 65-69 | 70-74 | 75-79 | ≥ 80 |
|---|---|---|---|---|---|---|
| Toutes stratégies | −0,02R | −0,04R | −0,07R | −0,02R | −0,07R | **−0,08R** (−0,04 / −0,13) |
| `trend_pullback` | **+0,15R** (+0,10 / +0,22) | −0,07R | −0,07R | −0,03R | −0,10R | 0,00R |
| `failed_breakout` | −0,09R | +0,03R | −0,14R | +0,04R | +0,07R | **−0,19R** (−0,28 / −0,10) |
| `failed_breakout_quick` | −0,09R | −0,02R | −0,13R | +0,04R | +0,22R | **−0,16R** (−0,20 / −0,12) |
| `rsi2_pullback` | −0,06R | −0,06R | 0,00R | −0,06R | −0,10R | **−0,20R** (−0,20 / −0,20) |

Lecture : **le score n'est pas calibré**. Il n'y a aucune relation croissante avec le résultat, et les scores ≥ 80 sont même parmi les pires (signaux « trop parfaits » = mouvements déjà étendus ?). Le score actuel (40 + 45 × qualité du détecteur + 15 × liquidité) ne doit donc **pas** servir à classer les opportunités entre elles.

Décision : aucune stratégie modifiée (refaire le score toucherait toutes les stratégies à la fois et changerait le filtre `minScoreLive` : trop gros pour un passage). Alerte au Produit : la mise en avant des « 3 meilleurs scores » (11/11 08h) n'a pas de base statistique. Mieux vaut classer par **stratégie** (celles qui ont le meilleur historique live d'abord), puis par fraîcheur du signal.

## 2026-11-11 12h30 — Stratège : longs `trend_pullback` 0/3 = trades contre BTC (aucun changement de version)

Live : radar 14 clos, +1,44R net. `trend_pullback@1` : 13 trades, +2,48R (E +0,19R), sous les 15 trades du seuil de coupe `explore`, donc pas de décision. Journée du 11/11 : −4,16R. Le risque de dépasser −6R vient des trades ouverts : la règle P0 attend la validation de l'utilisateur.

Vérification de la tendance BTC 4h (EMA20/EMA50) à l'ouverture de chaque trade `trend_pullback` live :
- **Alignés BTC** (shorts, BTC 4h baissier) : 11 clos, **+4,53R**.
- **Contre BTC** (longs PEPE 10/11 23h, INJ 11/11 08h) : 2 clos, **2 stops, −2,05R**.

C'est cohérent avec le backtest 180 j : les trades `trend_pullback` contre BTC perdent dans les 4 trimestres (STRATEGY_LOG 10/11 18h30).

Pourquoi pas de `trend_pullback` v2 avec `btcRegime: "with"` (le garde-fou de 24 h est passé) :
- gain modeste en backtest 180 j (−0,05R → −0,02R par trade, chaque moitié un peu meilleure) ;
- la nouvelle version remettrait à zéro 13 trades live, alors que le plan GO demande ≥ 30 trades au 24/11 ;
- la variante labo `trend_pullback_btc` ne confirme pas pour l'instant (−0,71R/trade à période égale, n petit, univers de 50 cryptos).

Décision : **rien ne change dans la stratégie**. Proposition sans risque pour le Produit : afficher sur les cartes un tag « ⚠️ contre BTC 4h » (la série BTC 4h est déjà calculée par le scan), pour que le trader évite ces trades à la main. À rediscuter si les trades contre BTC continuent de perdre (≥ 5 cas).

## 2026-11-11 15h30 — Stratège : correctif `donchian_trend_vol` muet en live + régime BTC exposé (aucun changement de paramètres)

Live : `trend_pullback@1` 14 trades, +3,03R (E +0,22R, DD 4,2R), sous les 15 trades du seuil de coupe, donc pas de décision. Aucune autre stratégie radar n'a de volume.

**Bug corrigé** : le scan ne chargeait que 400 bougies 1h de BTC (= 100 bougies 4h), alors que le centile de volatilité de `params.btcVolMinPct` en exige 120. En live, le filtre refusait donc **tous** les signaux, et `donchian_trend_vol` (labo, créée le 10/11 21h30) n'a jamais pu trader : 0 trade, aucune stat à invalider. Le backtest n'était pas touché, car il charge 180 j d'historique. Correctif : le scan charge ≥ 800 bougies 1h pour BTC. Test ajouté. Les paramètres ne changent pas, donc pas de nouvelle version.

**Affichage** : `state.market.btcRegime = { trend4h: "up"|"down", volPct, barTime }` (même définition que les filtres), pour le tag P1 « ⚠️ contre BTC 4h » du Produit. Au moment du scan de test : BTC 4h baissier, volatilité au 71e centile.

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

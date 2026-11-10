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

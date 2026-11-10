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

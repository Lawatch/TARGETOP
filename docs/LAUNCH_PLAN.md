# Plan de lancement live — objectif 1er décembre 2026

**Principe directeur : accélérer l'apprentissage, pas la prise de risque.** L'objectif reste le profit
sur le challenge ; on ne lance en réel que ce qui a prouvé un avantage après frais.

## Ce que disent les données (10/11, backtests Kraken Futures)

| Levier proposé | Test | Verdict |
|---|---|---|
| Plus court terme (15m) | 90 j / 25 symboles, frais 0,05 %/côté | **Non** : −0,25R et −0,17R/trade. Les frais mangent tout. Même sans frais : ≈ 0R. |
| Plus de cryptos en live | 50 vs 25 symboles, 90 j | **Non pour le live** : l'avantage disparaît (≈ 0R) sur les alts peu liquides. **Oui pour le labo** : plus de trades papier = verdict plus rapide. |
| Plus d'historique | 180 j au lieu de 90 | **Oui, indispensable** : `failed_breakout` passe de +0,12R (90 j) à 0,00R (180 j). Le résultat de départ dépendait du régime de marché. |
| Filtre de régime (sens de la tendance 4h) | 180 j / 25 | **Prometteur** : `failed_breakout` 0,00R → +0,09R (PF 1,16), mais instable (−0,04 / +0,21). En labo. |
| Frais 0 (si le challenge n'a pas de frais) | 1h, 90 j / 25 | **Énorme** : `failed_breakout` +0,23R, `trend_pullback` +0,12R. **À clarifier en priorité : quel challenge, quels frais ?** |

## Accélérateurs mis en place
1. **Labo élargi** : scan de 50 perps ; le live reste limité au top 25 liquide. Les variantes `shadow` collectent ~2× plus de trades.
2. **Variantes en parallèle** : plusieurs déclinaisons d'une même idée tournent en `shadow` en même temps (ex. `failed_breakout_regime`, `failed_breakout_quick`) au lieu d'être testées l'une après l'autre.
3. **Standard de backtest relevé** : 180 j / 25 symboles, positif sur les 2 moitiés, avant tout passage en live.
4. **Rotation horaire des experts** (Analyste → Stratège → Produit).

## Jalons
| Date | Jalon |
|---|---|
| 17/11 | ≥ 6 variantes en labo ; frais du challenge confirmés et intégrés (`feePctPerSide`) ; ≥ 30 trades papier sur les 2 stratégies live. |
| 24/11 | Revue go/no-go par stratégie (critères ci-dessous) ; mode d'emploi du lancement sur le site. |
| 01/12 | Lancement réel avec **uniquement** les stratégies « GO ». |

## Critères GO (par stratégie) pour le 1er décembre
- Backtest 180 j / 25 symboles : espérance > +0,05R après frais, positive sur les 2 moitiés.
- Paper live : ≥ 30 trades, espérance > 0, drawdown < 10R, aucune journée pire que −6R (= −3 % à 0,5 %/trade).
- Si **aucune** stratégie n'est GO : lancement en mode « radar + décision manuelle » à risque réduit (0,25 %/trade), pas de suivi aveugle.

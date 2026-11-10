# Rapport des agents

## 2026-11-10 · Mise en place (session initiale)
- Radar en ligne : scan des 25 perpétuels les plus liquides de Kraken Futures toutes les ~10 min, signaux long/short avec entrée, stop, TP1, TP2 et taille de position selon ton compte challenge.
- Chaque signal est paper-tradé automatiquement (frais et slippage inclus) : la section Performance mesure la fiabilité **réelle**.
- Backtest initial honnête : les stratégies « classiques » en 15m perdaient (−0,28R/trade). Passage en 1h + nouvelle stratégie « faux breakout » (+0,12R/trade en backtest 90 j, positive sur les 2 moitiés de la période). Rien n'est prouvé tant qu'on n'a pas 30 trades live.
- Relais des agents : un passage d'expert par heure (Analyste → Stratège → Produit), chaque rôle toutes les 3 h.

## 🔎 Analyste · 2026-11-10 11h UTC (point santé)
- **Santé** (maj 11:09) : scan OK (25 symboles, 0 erreur, ~2 s), dernier état 11:04 UTC. Le cron `*/10` n'a toujours jamais tourné seul, mais le commit « Scan en boucle (~7 min) dans chaque run » compense (3 scans 11:02→11:04). À vérifier au prochain passage : des runs `schedule` apparaissent-ils, et l'écart entre runs reste-t-il < 30 min ?
- **Trades** : 4 ouverts, 0 clos — tous `trend_pullback@1` **short** (SOL, XBT, XRP, HYPE), MFE +0,45 à +1,03R, MAE ≥ −0,15R. 8 signaux actifs, tous trend_pullback short : exposition 100 % unidirectionnelle (biais de marché baissier, à surveiller côté corrélation).
- **Reco** : Stratège → rien à décider (0 trade clos). Produit → si le cron reste muet, signaler sur le site que les données datent du dernier push.

## 🧠 Stratège · 2026-11-10 12h30 UTC
- **Live** : 0 trade clos (4 ouverts, tous `trend_pullback@1` short) → aucune décision de promotion. Aucune nouvelle version (v1 créées aujourd'hui, garde-fou 24 h).
- **Labo** : piste P1 `failed_breakout` (volume ≥ 1,5 et/ou stop + 0,5 ATR) testée sur 90 j / 25 symboles → rejetée : ces variantes n'améliorent que la 2e moitié (effet de régime probable). La v1 reste stable à +0,08R sur chaque moitié.
- **Reco** : Analyste → suivre la concentration 100 % short (corrélation). Prochain passage Stratège → filtre de régime BTC 4h (P1).

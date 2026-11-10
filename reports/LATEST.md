# Rapport des agents

## 2026-11-10 · Mise en place (session initiale)
- Radar en ligne : scan des 25 perpétuels les plus liquides de Kraken Futures toutes les ~10 min, signaux long/short avec entrée, stop, TP1, TP2 et taille de position selon ton compte challenge.
- Chaque signal est paper-tradé automatiquement (frais et slippage inclus) : la section Performance mesure la fiabilité **réelle**.
- Backtest initial honnête : les stratégies « classiques » en 15m perdaient (−0,28R/trade). Passage en 1h + nouvelle stratégie « faux breakout » (+0,12R/trade en backtest 90 j, positive sur les 2 moitiés de la période). Rien n'est prouvé tant qu'on n'a pas 30 trades live.
- Relais des agents : un passage d'expert par heure (Analyste → Stratège → Produit), chaque rôle toutes les 3 h.

## 🔎 Analyste · 2026-11-10 11h UTC (point santé)
- **Santé** : scan OK (25 symboles, 0 erreur, ~2 s), état frais à 11:02 UTC. ⚠️ Seulement **2 runs, tous deux déclenchés par push** (09:53, 11:02) : **le cron `*/10` n'a encore jamais tourné** (aucun run `schedule` dans Actions). Délai d'activation GitHub probable sur un workflow neuf ; à revérifier au prochain passage. Si toujours 0 run planifié : vérifier que la branche est bien la branche par défaut du dépôt et lancer un `workflow_dispatch`.
- **Trades** : 4 ouverts, 0 clos — tous `trend_pullback@1` **short** (SOL, XBT, XRP, HYPE), MFE +0,45 à +1,03R, MAE ≥ −0,15R. 8 signaux actifs, tous trend_pullback short : exposition 100 % unidirectionnelle (biais de marché baissier, à surveiller côté corrélation).
- **Reco** : Stratège → rien à décider (0 trade clos). Produit → si le cron reste muet, signaler sur le site que les données datent du dernier push.

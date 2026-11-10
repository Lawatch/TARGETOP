# Backlog partagé (agents)

Priorité : P1 = important, P2 = utile, P3 = idée. Chaque agent coche/complète ce qu'il traite.

## Stratégie
- [ ] P1 Filtre de régime de marché (tendance BTC 4h / volatilité) appliqué à toutes les stratégies : les shorts ont mieux marché sur les 45 derniers jours, est-ce un biais de régime ?
- [ ] P1 `failed_breakout` : tester une confirmation volume plus stricte et un stop au-delà de la mèche + 0,5 ATR.
- [ ] P2 Ajouter l'historique de funding (endpoint `historicalfundingrates`) au backtest pour évaluer `funding_squeeze`.
- [ ] P2 Score : calibrer le score sur le résultat réel (les scores ≥ 75 gagnent-ils plus ?).
- [ ] P3 Open interest : détecter les hausses de prix avec OI en baisse (short squeeze) et inversement.
- [ ] P3 Force relative vs BTC (classement momentum des alts).

## Produit
- [ ] P1 Vérifier que le site s'ouvre depuis le PC pro (sinon : prévoir un miroir).
- [ ] P2 Filtre rapide par actif / sens sur les cartes.
- [ ] P2 Mini-graphique (SVG) des 48 dernières bougies 1h sur chaque carte avec niveaux entrée/SL/TP.
- [ ] P3 Mode « pré-alerte » : setup en formation (pas encore validé).

## Fiabilité
- [ ] P1 Surveiller les retards du cron GitHub (souvent 10 à 20 min) : si trop lent, déclencher aussi le scan depuis les sessions agents.

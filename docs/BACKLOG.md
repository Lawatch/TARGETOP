# Backlog partagé (agents)

Priorité : P1 = important, P2 = utile, P3 = idée. Chaque agent coche/complète ce qu'il traite.

## Stratégie
- [~] P1 Filtre de régime BTC 4h : analyse a posteriori du 10/11 (STRATEGY_LOG) → utile pour `trend_pullback` (2e moitié +0,03R → +0,12R, 1re moitié inchangée), inutile pour `failed_breakout`. **À faire à partir du 11/11** : option `btcRegime` dans `src/core` (BTC 4h passé dans `meta`) + test + vrai backtest avant une éventuelle `trend_pullback` v2.
- [ ] P2 `breakout_volume` (shadow) : négatif dans tous les régimes en backtest (−0,15R / −0,33R par moitié) → envisager `disabled` pour alléger le site.
- [x] P1 `failed_breakout` : volume plus strict / stop mèche + 0,5 ATR → testé le 10/11, rejeté (incohérent entre les 2 moitiés, voir STRATEGY_LOG). Si on y revient, ce sera via le filtre de régime.
- [ ] P2 Ajouter l'historique de funding (endpoint `historicalfundingrates`) au backtest pour évaluer `funding_squeeze`.
- [ ] P2 Score : calibrer le score sur le résultat réel (les scores ≥ 75 gagnent-ils plus ?).
- [ ] P3 Open interest : détecter les hausses de prix avec OI en baisse (short squeeze) et inversement.
- [ ] P3 Force relative vs BTC (classement momentum des alts).

## Produit
- [ ] P1 Vérifier que le site s'ouvre depuis le PC pro (sinon : prévoir un miroir).
- [ ] P2 Filtre rapide par actif / sens sur les cartes.
- [ ] P2 Mini-graphique (SVG) des 48 dernières bougies 1h sur chaque carte avec niveaux entrée/SL/TP.
- [x] P1 Bandeau « radar en retard » au-dessus des opportunités si le dernier scan date de plus de 30 min (produit, 10/11).
- [ ] P3 Mobile : les libellés « Stop +0,96 % » / « TP2 −7,70 % » passent sur 2 lignes dans les cases niveaux (raccourcir ou réduire la police).
- [ ] P3 Mode « pré-alerte » : setup en formation (pas encore validé).

## Fiabilité
- [ ] P1 Surveiller les retards du cron GitHub (souvent 10 à 20 min) : si trop lent, déclencher aussi le scan depuis les sessions agents.

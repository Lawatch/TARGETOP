# Backlog partagé (agents)

Priorité : P1 = important, P2 = utile, P3 = idée. Chaque agent coche/complète ce qu'il traite.

## Stratégie
- [ ] P1 Produit : tag « ⚠️ contre BTC 4h » sur les cartes d'opportunité (sens opposé à la tendance EMA20/EMA50 de BTC 4h). En live, ces trades `trend_pullback` font 0/2 (−2,05R) contre +4,53R pour les trades alignés ; en backtest 180 j, ils perdent dans les 4 trimestres. Le scan devra exposer `btcTrend` dans `state.json`.
- [ ] P2 Analyste/Produit : comparer une variante labo à sa stratégie radar **sur la même période et le même univers (top 25)**. Les stats brutes labo (50 cryptos, démarrage décalé) faussent la comparaison (cas `trend_pullback_btc` du 11/11).
- [ ] **P0 Règle de portefeuille (à valider par l'utilisateur)** : max 3 positions radar dans le même sens + plus d'entrée après −3R réalisés dans la journée. Backtest 180 j : pire jour −25R → −7R (risque plein), −3,5R à demi-risque ; jours ≤ −6R : 57 → 2 (voir STRATEGY_LOG 11/11 03h30). À appliquer au paper-trading radar (scan) et à l'affichage (cartes « ne pas prendre : plafond atteint »).
- [ ] P0 Intégrer les frais réels du challenge dans `config/settings.json` (`feePctPerSide`) dès qu'ils sont confirmés, et refaire les backtests de référence.
- [ ] P1 Décliner le filtre `regime: "with"` sur `trend_pullback` / autres idées en variantes shadow (180 j / 25).
- [x] P1 Filtre de régime BTC : tendance → `params.btcRegime` (variante `trend_pullback_btc`) ; volatilité → `params.btcVolMinPct` (variante `donchian_trend_vol`).
- [ ] P2 `trend_pullback` : candidat de v2 « filtre BTC + suiveur 1 ATR » (180 j : −0,06R → +0,01R, DD 222R → 140R), mais aucun avantage démontré : à tester en labo plutôt qu'en v2 directe.
- [ ] P1 ≥ 11/11 21h : si `donchian_trend_vol` ne dément pas en labo, `donchian_trend` v2 avec `btcVolMinPct: 0.33` (backtest 180 j : +0,16R → +0,31R).
- [ ] P2 `breakout_volume` (shadow) : négatif dans tous les régimes en backtest (−0,15R / −0,33R par moitié) → envisager `disabled` pour alléger le site.
- [x] P1 `failed_breakout` : volume plus strict / stop mèche + 0,5 ATR → testé le 10/11, rejeté (incohérent entre les 2 moitiés, voir STRATEGY_LOG). Si on y revient, ce sera via le filtre de régime.
- [ ] P2 Ajouter l'historique de funding (endpoint `historicalfundingrates`) au backtest pour évaluer `funding_squeeze`.
- [x] P2 Score : calibration testée le 11/11 (STRATEGY_LOG 09h30) → **le score ne prédit rien** (≥ 80 = parmi les pires).
- [x] P1 Produit : opportunités classées par actif pas encore en cours, puis historique live de la stratégie (espérance nette), puis fraîcheur ; score affiché en petit, gris, avec l'infobulle « non calibré » ; plus aucune mention de « meilleurs scores » (produit, 11/11 11h).
- [ ] P2 Stratège : refaire le score (ex. espérance backtest de la stratégie × régime BTC courant) ou le supprimer ; à backtester avant.
- [ ] P3 Open interest : détecter les hausses de prix avec OI en baisse (short squeeze) et inversement.
- [ ] P3 Force relative vs BTC (classement momentum des alts).

## Produit
- [ ] P1 Vérifier que le site s'ouvre depuis le PC pro (sinon : prévoir un miroir).
- [ ] P2 Filtre rapide par actif / sens sur les cartes.
- [ ] P2 Mini-graphique (SVG) des 48 dernières bougies 1h sur chaque carte avec niveaux entrée/SL/TP.
- [x] P1 Bandeau « radar en retard » au-dessus des opportunités si le dernier scan date de plus de 30 min (produit, 10/11).
- [x] P1 « Paper-trading en cours » : seuls les trades radar (live/explore) sont visibles, les trades labo sont repliés dans un tiroir (produit, 10/11 17h).
- [x] P2 Radar marché : colonnes funding coupées sur desktop (prix passé sous le symbole, titres sur 2 lignes) (produit, 10/11 17h).
- [ ] P2 Encart « Opportunités » vide alors que le labo a 12 signaux : afficher une ligne « 0 signal radar · N en labo » pour qu'on comprenne que le scan tourne.
- [x] P2 Tableau Performance : lisible sur mobile (statut sous le nom, colonnes secondaires masquées < 600 px), stratégies du radar en tête puis tri par total R, PF au format français (produit, 10/11 20h).
- [x] P1 Ligne « risque engagé » sous les trades radar : pire cas si tous les stops sont touchés (R, $, % de la perte max jour/totale) + alerte quand tous les trades sont dans le même sens (produit, 10/11 23h).
- [x] P1 Carte d'opportunité : tag « 📈 Déjà en cours » si un trade radar est ouvert sur l'actif (ou ⚠️ si sens opposé), pour ne pas doubler la position. Correctifs : cases niveaux qui débordaient avec les micro-prix (PEPE), levier « 0.0x » → « <0.1x » (produit, 11/11 02h).
- [x] P2 Mobile : « Paper-trading en cours » tient dans l'écran (Actif ▲/▼, Stop, Prix, R live ; colonnes secondaires masquées < 600 px), vérifié iPhone 13 et SE (produit, 11/11 05h).
- [x] P1 Opportunités : au-delà de 4 signaux, seuls les 3 premiers (hors actifs déjà en cours ; classement revu le 11/11 11h, voir ci-dessus) sont affichés, le reste est replié dans « Voir les N autres signaux » (produit, 11/11 08h).
- [x] P0 Ligne 🛡️ « Aujourd'hui (UTC) » : réalisé du jour des trades radar + pire cas des stops ouverts = pire fin de journée, en R compte (½ risque en explore) et % de la perte max jour ; ⛔ si la limite peut être (ou est) dépassée (produit, 11/11 14h).
- [ ] P1 Tag « ⚠️ contre BTC 4h » sur les cartes (proposé par le Stratège le 11/11 12h30). **Données disponibles** depuis le 11/11 15h30 : `state.market.btcRegime.trend4h` (`up`/`down`) ; un long avec `down` (ou un short avec `up`) est « contre BTC ».
- [ ] P3 Mobile : la page est très longue (Radar marché = 4 tableaux empilés) ; envisager de replier le Radar marché par défaut sur mobile.
- [ ] P3 Mobile : les libellés « Stop +0,96 % » / « TP2 −7,70 % » passent sur 2 lignes dans les cases niveaux (raccourcir ou réduire la police).
- [ ] P3 Mode « pré-alerte » : setup en formation (pas encore validé).

## Fiabilité
- [ ] P1 Surveiller les retards du cron GitHub (souvent 10 à 20 min) : si trop lent, déclencher aussi le scan depuis les sessions agents.

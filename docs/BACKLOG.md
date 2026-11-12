# Backlog partagé (agents)

Priorité : P1 = important, P2 = utile, P3 = idée. Chaque agent coche/complète ce qu'il traite.

## Stratégie
- [ ] P1 Produit/Utilisateur : sur les cartes, rendre le tag « ⚠️ contre BTC 4h » plus directif (« déconseillé : contre la tendance BTC ») : en backtest, ignorer ces signaux divise le drawdown de `failed_breakout` par ~2 sur 4 fenêtres sur 4 (STRATEGY_LOG 12/11 03h30).
- [x] Outil : `backtest.mjs --end-days-ago N` pour valider un filtre sur des fenêtres décalées (Stratège, 12/11). Standard proposé pour tout nouveau filtre : 180 j + 90 j × fins à 0, 30 et 60 j.
- [ ] P2 `params.liveUniverseOnly` (+ score min) pour les variantes `shadow` d'une stratégie radar : même univers top 25 et mêmes filtres que le parent, sinon la comparaison est faussée (cas `trend_pullback_btc` : 15 trades sur 25 sans équivalent chez le parent). À appliquer aux prochaines variantes (une variante existante changerait de version).
- [x] P1 Produit : tag « ⚠️ contre BTC 4h » sur les cartes d'opportunité (sens opposé à la tendance EMA20/EMA50 de BTC 4h). En live, ces trades `trend_pullback` font 0/2 (−2,05R) contre +4,53R pour les trades alignés ; en backtest 180 j, ils perdent dans les 4 trimestres. Le scan devra exposer `btcTrend` dans `state.json`. → **fait** (produit, 11/11 17h) : tag rouge sur les cartes, signaux contre BTC classés en dernier, tendance 4h dans la pastille BTC.
- [ ] P2 Analyste/Produit : comparer une variante labo à sa stratégie radar **sur la même période et le même univers (top 25)**. Les stats brutes labo (50 cryptos, démarrage décalé) faussent la comparaison (cas `trend_pullback_btc` du 11/11).
- [ ] **P0 Règle de portefeuille (à valider par l'utilisateur)** : max 3 positions radar dans le même sens + plus d'entrée après −3R réalisés dans la journée + **une seule position radar par actif** (cas ZEC long et short le 11/11). Backtest 180 j : pire jour −25R → −7R (risque plein), −3,5R à demi-risque ; jours ≤ −6R : 57 → 2 (voir STRATEGY_LOG 11/11 03h30). À appliquer au paper-trading radar (scan) et à l'affichage (cartes « ne pas prendre : plafond atteint »).
- [ ] P0 Intégrer les frais réels du challenge dans `config/settings.json` (`feePctPerSide`) dès qu'ils sont confirmés, et refaire les backtests de référence.
- [ ] P1 Décliner le filtre `regime: "with"` sur `trend_pullback` / autres idées en variantes shadow (180 j / 25).
- [x] P1 Filtre de régime BTC : tendance → `params.btcRegime` (variante `trend_pullback_btc`) ; volatilité → `params.btcVolMinPct` (variante `donchian_trend_vol`).
- [ ] P2 `trend_pullback` : candidat de v2 « filtre BTC + suiveur 1 ATR » (180 j : −0,06R → +0,01R, DD 222R → 140R), mais aucun avantage démontré : à tester en labo plutôt qu'en v2 directe.
- [x] ~~P1 ≥ 11/11 21h : `donchian_trend` v2~~ → rejetée le 11/11 21h30 (le filtre dégrade le 90 j, effet de fenêtre). Ancien texte : si `donchian_trend_vol` ne dément pas en labo, `donchian_trend` v2 avec `btcVolMinPct: 0.33` (backtest 180 j : +0,16R → +0,31R).
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
- [x] P1 Tag « ⚠️ contre BTC 4h » sur les cartes (proposé par le Stratège le 11/11 12h30). **Données disponibles** depuis le 11/11 15h30 : `state.market.btcRegime.trend4h` (`up`/`down`) ; un long avec `down` (ou un short avec `up`) est « contre BTC ». → **fait** (produit, 11/11 17h) : tag rouge sur les cartes, signaux contre BTC classés en dernier, tendance 4h dans la pastille BTC.
- [x] P0 Bug : la ligne 🛡️ « Aujourd'hui » sous-estimait fortement le réalisé du jour (−0,11R affiché au lieu de −2,19R compte), car `recentClosed` est tronqué à 40 trades labo compris. Le scan expose désormais `state.todayClosed` (trades radar clos depuis minuit UTC, ajout rétrocompatible) (produit, 11/11 20h).
- [x] P1 Positions radar opposées sur un même actif (ZEC long + short) : lignes marquées ⇄ dans « Paper-trading en cours » + avertissement dans la ligne 🛡️ (produit, 11/11 23h). La prévention relève de la règle P0 (« une seule position radar par actif »), à valider par l'utilisateur.
- [x] P1 Fiabilité : le scan de 22:43 le 11/11 a écrit un univers vide (tickers Kraken inexploitables) **sans erreur** ; le site affichait « 0 actifs » en vert. Le scan signale maintenant l'erreur, et la pastille passe en orange « ⚠️ incomplet ». Aucun trade n'a été affecté (suivi 1m normal) (produit, 11/11 23h).
- [ ] P2 Fiabilité : si les tickers sont vides, le scan pourrait réutiliser `prevState.market` au lieu d'écrire un marché vide (à discuter : données périmées signalées comme telles ou rien).
- [x] P1 « Forme récente » : `stats.lastResults` (10 derniers résultats, testé) → pastilles vert/rouge/gris + espérance sur les 10 derniers sur les cartes et dans le tableau Performance ; « 📉 en baisse » si ≤ −0,20R/trade sur ≥ 5 trades (produit, 12/11 02h).
- [x] P1 Tag « contre BTC » directif (demande Stratège 12/11 03h30) : « ⛔ Déconseillé… ne le prends pas » + carte atténuée ; trades radar ouverts contre BTC marqués ⚠️ dans le tableau (icône seule sur mobile) (produit, 12/11 05h).
- [ ] P3 Mobile : la page est très longue (Radar marché = 4 tableaux empilés) ; envisager de replier le Radar marché par défaut sur mobile.
- [ ] P3 Mobile : les libellés « Stop +0,96 % » / « TP2 −7,70 % » passent sur 2 lignes dans les cases niveaux (raccourcir ou réduire la police).
- [ ] P3 Mode « pré-alerte » : setup en formation (pas encore validé).

## Fiabilité
- [ ] P1 Surveiller les retards du cron GitHub (souvent 10 à 20 min) : si trop lent, déclencher aussi le scan depuis les sessions agents.

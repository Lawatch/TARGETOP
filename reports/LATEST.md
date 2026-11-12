# Rapport des agents

## 🧪 Mode exploration (10/11 fin d'après-midi)
- On teste plus d'idées, plus vite, avec une mise réduite : statut **Exploration** = dans le radar à **demi-risque**, coupé si < −0,20R après 15 trades, post-mortem par l'Analyste.
- En exploration : **Suivi de tendance (canal, long)** (+0,14R sur 180 j), Pullback de tendance, Faux breakout. Aucune stratégie n'est encore « live » à risque plein.
- 3 nouvelles familles en labo, et l'univers ne contient plus que des cryptos (actions tokenisées, or, pétrole exclus).

## 🚀 Sprint lancement 1er décembre (10/11 après-midi)
- Objectif inchangé : du profit. On accélère **l'apprentissage**, pas le risque. Plan et critères GO : `docs/LAUNCH_PLAN.md`.
- Testé et rejeté : passer en 15m (frais : −0,25R/trade), élargir le live aux petites alts (≈ 0R).
- Mis en place : labo élargi à 50 cryptos, variantes testées en parallèle, backtests sur 180 jours.
- ⚠️ Lecture honnête : sur 180 jours, aucune stratégie n'a encore d'avantage solide **avec frais**. Sans frais, l'avantage devient net : il faut confirmer les frais du challenge.

## 2026-11-10 · Mise en place (session initiale)
- Radar en ligne : scan des 25 perpétuels les plus liquides de Kraken Futures toutes les ~10 min, signaux long/short avec entrée, stop, TP1, TP2 et taille de position selon ton compte challenge.
- Chaque signal est paper-tradé automatiquement (frais et slippage inclus) : la section Performance mesure la fiabilité **réelle**.
- Backtest initial honnête : les stratégies « classiques » en 15m perdaient (−0,28R/trade). Passage en 1h + nouvelle stratégie « faux breakout » (+0,12R/trade en backtest 90 j, positive sur les 2 moitiés de la période). Rien n'est prouvé tant qu'on n'a pas 30 trades live.
- Relais des agents : un passage d'expert par heure (Analyste → Stratège → Produit), chaque rôle toutes les 3 h.

## 🔎 Analyste · 2026-11-12 05h10 UTC (point santé) · rapport complet : `reports/2026-11-11-23h-analyste.md` (prochain à 11h)
- **Santé** : ✅ 382 runs, aucun trou > 8 min sur 3 h, 0 erreur, dernier à 05:01 UTC ; scan moyen revenu à 3,7 s.
- **Radar** : DASH short clos à +1,16R. Cumul 22 clos, **+1,36R** ; `trend_pullback@1` 11/19, +2,77R (E +0,15) ; shorts +4,83R, longs −3,46R. 12/11 : +1,16R. 7 ouverts, dont **3 longs `failed_breakout` (DOGE, LINK, UNI) + XRP + XBT non sécurisés** : pire cas du jour ≈ −3,8R (limite −6R ✅).
- **Note Stratège** : les 3 longs ouverts vont dans le sens que le radar perd jusqu'ici (longs 1/5). Ils serviront à tester en live le tag « contre BTC », s'ils sont tagués. Labo calme (2 clos depuis minuit).

## 🧠 Stratège · 2026-11-12 03h30 UTC
- **Cycle de vie** : aucun seuil atteint (`trend_pullback@1` 19 trades, E +0,15R ; labo sous 30 trades). `rsi2_pullback` remonte (+0,31R sur ses 15 derniers trades).
- **Labo** : sur `failed_breakout`, le filtre BTC 4h **divise le drawdown par ~2 sur les 4 fenêtres testées** (146 → 57R sur 180 j) et améliore l'espérance sur 2 d'entre elles. Mais la stratégie reste sans avantage démontré (+0,03R sur 180 j avec filtre), donc pas de v2.
- **Reco** : Produit → rendre le tag « contre BTC » directif (« déconseillé »). **Trader** : éviter les signaux contre la tendance BTC 4h, ce qui revient à appliquer le filtre à la main. **Utilisateur** : la règle P0 de portefeuille attend toujours ta validation (le 11/11 a fini à −5,40R, à 0,6R de la limite).

## 🛠️ Produit · 2026-11-10 13h50 UTC
- **Vu** : scan frais (13:46 UTC, 0 erreur), 3 opportunités actives, toutes SHORT. Aucun bug bloquant ; 0 erreur console sur desktop et mobile.
- **Fait** (1 changement visible) : un bandeau orange « radar en retard, opportunités peut-être périmées » s'affiche au-dessus des cartes dès que le dernier scan date de plus de 30 min (reco Analyste). Correctif d'affichage : « il y a 2 h 0 » devient « il y a 2 h », « 1 h 5 » devient « 1 h 05 ».
- **Reco** : Analyste → si le bandeau apparaît souvent, c'est que le cron décroche (P1 Fiabilité). Prochain Produit → filtre rapide actif/sens (P2) ou mini-graphique SVG (P2).

## 🛠️ Produit · 2026-11-10 17h UTC
- **Vu** : scan frais (16:43 UTC, 34 actifs, 0 erreur). 13 trades ouverts mais **1 seul du radar** (XBT `trend_pullback` short, +1,6R) : les 12 trades labo noyaient le seul trade à suivre. 0 signal radar, 12 labo. NVDAX/SPCXX en labo : ouverts à 16:01, juste avant l'exclusion des non-crypto (16:07). Ils se clôtureront normalement, ce n'est pas un bug.
- **Fait** (1 changement visible) : la section « Paper-trading en cours » ne montre plus que les trades radar ; les trades labo sont dans un tiroir replié (« 🧪 12 trade(s) labo en cours, à ne pas trader »), qui reste ouvert au rafraîchissement. Correctif : les colonnes funding du Radar marché étaient coupées sur desktop. Vérifié desktop + mobile, 0 erreur console, 16 tests OK.
- **Reco** : Analyste → rien de neuf côté front. Prochain Produit → P2 : expliquer l'encart « Opportunités » vide quand le labo a des signaux, puis filtre actif/sens.

## 🛠️ Produit · 2026-11-10 20h UTC
- **Vu** : scan frais (19:44 UTC, 0 erreur), 0 signal, 0 trade radar ouvert (13 labo). Radar : 7 clos, +5,61R ; `trend_pullback` 6/6 (+6,64R). Aucun bug bloquant. Sur mobile, le tableau Performance cachait ses chiffres (seules les colonnes Stratégie et Statut étaient visibles, le reste était hors écran) et le PF s'affichait « 6.434 ».
- **Fait** (1 changement visible) : le tableau Performance place le statut sous le nom, masque Réussite/PF/DD sous 600 px et met **ce qui marche en tête** (stratégies du radar d'abord, puis tri par total R). PF au format « 6,43 ». Vérifié desktop + mobile, 0 erreur console, 18 tests OK.
- **Reco** : Analyste → rien côté front. Prochain Produit → filtre actif/sens (P2) quand il y aura des signaux, ou replier le Radar marché sur mobile (P3).

## 🛠️ Produit · 2026-11-10 23h UTC
- **Vu** : scan frais (22:46 UTC, 0 erreur). 4 trades radar ouverts, **tous `trend_pullback` short** (XLM, FET, TAO, AVAX, en `explore` donc demi-risque), 20 trades labo. Aucun bug ; les R affichés sont bien nets de frais (cohérent avec `resultR`, cf. échange Analyste/Stratège).
- **Fait** (1 changement visible) : sous les trades radar, une ligne 🛡️ affiche le **pire cas si tous les stops sont touchés**. Aujourd'hui : −2,07R = −52 $, soit 35 % de la perte max jour Prop (21 % de la perte max Funded). Elle signale aussi quand tous les trades sont dans le même sens. La couleur passe au vert, à l'orange puis au rouge selon la part de la limite consommée, et suit les réglages du compte. Vérifié desktop + mobile, 0 erreur console, 19 tests OK.
- **Reco** : Analyste → le chiffre « pire cas » peut servir au suivi de conformité challenge. Prochain Produit → P2 mobile : rendre « R live » visible sans défilement.

## 🛠️ Produit · 2026-11-11 02h UTC
- **Vu** : scan frais (01:46 UTC, 0 erreur). 4 opportunités radar (XBT, HYPE, XMR short ; PEPE long) et 5 trades radar ouverts (−2,66R = 44 % de la perte max jour si tous les stops sont touchés). **XBT et PEPE avaient déjà un trade ouvert** sans que la carte le dise : risque de doubler la position. Bugs : la case TP2 de PEPE débordait de la carte (micro-prix), et le levier s'affichait « 0.0x ».
- **Fait** (1 changement visible) : un tag « 📈 Déjà en cours (entrée, depuis) : ne double pas la position » apparaît sur la carte quand un trade radar est déjà ouvert sur l'actif ; si ce trade est en sens opposé, un tag ⚠️ « signal contradictoire, abstiens-toi » le remplace. Correctifs du débordement et du levier (« <0.1x »). Vérifié desktop + mobile, 0 erreur console, aucune carte qui déborde, 19 tests OK.
- **Reco** : Analyste → HYPE et XMR n'ont pas été ouverts en paper (plafond de 4 trades dans le même sens, à confirmer). Prochain Produit → P2 mobile : « R live » visible sans défilement.

## 🛠️ Produit · 2026-11-11 05h UTC
- **Vu** : scan frais (04:47 UTC, 0 erreur). 1 opportunité radar (ADA short), 5 trades radar ouverts (pire cas −1,85R = 31 % de la perte max jour), 29 labo. Aucun bug. Sur mobile, il fallait faire défiler le tableau des trades en cours pour voir « R live », la colonne la plus utile.
- **Fait** (1 changement visible) : sous 600 px, le tableau ne garde que Actif (avec ▲ L / ▼ S coloré), Stop, Prix et **R live**. Il tient sans défilement sur iPhone 13 comme sur SE, y compris avec les micro-prix (PEPE). Desktop inchangé. 0 erreur console, 19 tests OK.
- **En attente** : la règle de portefeuille P0 du Stratège (max 3 dans le même sens, stop jour −3R) attend la **validation de l'utilisateur** ; côté Produit, rien n'est implémenté avant. Si elle est validée : tag « plafond atteint, ne pas prendre » sur les cartes (le tag « Déjà en cours » et la ligne 🛡️ préparent le terrain).

## 🛠️ Produit · 2026-11-11 08h UTC
- **Vu** : scan frais (07:45 UTC, 0 erreur). **14 signaux radar SHORT en même temps** (tous `trend_pullback`, scores de 62 à 85), soit un mur de 14 cartes, alors que le site conseille d'en prendre 1 ou 2. 5 trades radar ouverts. Aucun bug, 0 erreur console.
- **Fait** (1 changement visible) : au-delà de 4 signaux, seuls les **3 meilleurs scores** (hors actifs déjà en cours) restent affichés ; les autres sont dans un tiroir « Voir les N autres signaux » (cartes compactes, prix live, tiroir gardé ouvert au rafraîchissement). Ce n'est que de l'affichage : le paper-trading et les règles ne changent pas. Vérifié desktop + mobile, 19 tests OK.
- **En attente** : la règle de portefeuille P0 attend toujours la validation de l'utilisateur. Ce passage-ci montrerait concrètement son effet : avec max 3 dans le même sens, 11 des 14 signaux seraient « ne pas prendre ».

## 🛠️ Produit · 2026-11-11 11h UTC
- **Vu** : scan frais (10:46 UTC, 0 erreur), 3 opportunités radar (ETH et ENA short, UNI long), 6 trades radar ouverts, aucun bug bloquant. Suite à l'alerte du Stratège (score non calibré), ma mise en avant des « 3 meilleurs scores » de 08h n'avait pas de base statistique, et la carte affichait encore le score en surbrillance.
- **Fait** (1 changement visible) : les opportunités sont classées par **actif pas encore en cours → historique live de la stratégie (espérance nette) → fraîcheur**. Le score est devenu un petit badge gris « score 82 », avec l'infobulle « non calibré, à ne pas utiliser pour choisir ». Les textes ne parlent plus de « meilleurs scores » (alerte de corrélation, tiroir, notifications). Correctif : quand un actif a un trade long **et** un short ouverts (UNI), le tag « Déjà en cours » affiche celui du même sens. Vérifié desktop + mobile, 0 erreur console, 19 tests OK.
- **En attente** : la règle de portefeuille P0 attend toujours la validation de l'utilisateur. Stratège → si le score est refait (P2), le Produit pourra le remettre en avant.

## 🛠️ Produit · 2026-11-11 14h UTC
- **Vu** : scan frais (13:47 UTC, 0 erreur), 5 opportunités radar short, 6 trades radar ouverts, aucun bug. Analyste et Stratège alertent sur la journée du 11/11 (−4,16R en R de trade), or le site ne montrait que le pire cas des trades ouverts, pas le **réalisé du jour**.
- **Fait** (1 changement visible) : la ligne 🛡️ devient « Aujourd'hui (UTC) : réalisé −2,08R (−52 $) sur 7 trades radar clos · pire cas des stops ouverts −0,91R → **pire fin de journée −2,99R (−75 $) = 50 % de ta perte max jour** ». En R **compte** : l'exploration est à demi-risque, donc −4,16R de trade = −2,08R compte. Au-delà de 67 % : « évite d'ouvrir de nouvelles positions » ; au-delà de 100 % : ⛔. Elle s'affiche même sans trade ouvert, et les cas limites sont testés (limite déjà dépassée). Vérifié desktop + mobile, 0 erreur console, 19 tests OK.
- **Reco** : Analyste → exprimer aussi la journée en R compte (demi-risque) pour coller au site. Stratège → le tag « contre BTC 4h » (P1) demande que le scan expose la tendance BTC 4h dans `state` ; je l'affiche dès que la donnée existe. La règle P0 attend toujours l'utilisateur.

## 🛠️ Produit · 2026-11-11 17h UTC
- **Vu** : scan frais (16:46 UTC, 0 erreur). BTC 4h **baissier**. 1 opportunité radar (ZRO short, alignée), 3 trades radar ouverts dont ZEC **long, donc contre BTC**. Aucun bug, 20 tests OK. Le Stratège a exposé `state.market.btcRegime`.
- **Fait** (1 changement visible) : tag rouge « ⚠️ Contre la tendance BTC 4h (baissière) : ce type de trade perd en live et en backtest » sur les cartes (radar et labo). Les signaux contre BTC passent **en dernier** dans le classement. La pastille BTC de l'en-tête affiche « 4h ↘ baissier / ↗ haussier ». Testé sur données réelles (pas de faux positif) et sur un signal long fabriqué (tag affiché, classé après). Desktop + mobile, 0 erreur console.
- **Reco** : Analyste → suivre en live le résultat des signaux tagués « contre BTC » par rapport aux autres. La règle P0 attend toujours l'utilisateur.

## 🛠️ Produit · 2026-11-11 20h UTC
- **Vu** : scan frais (19:46 UTC, 0 erreur), 5 opportunités short, 5 trades radar ouverts. **Bug grave sur ma ligne 🛡️** : elle affichait « réalisé au moins −0,11R sur 6 trades » au lieu de **−2,19R compte sur 13 trades** (−4,38R en R de trade). En cause : `recentClosed` est tronqué à 40 trades, labo compris, et le labo a fait 49 clôtures aujourd'hui.
- **Fait** (correctif, pas de nouvelle fonctionnalité) : `src/scan.mjs` ajoute à `state.json` le champ **`todayClosed`** (trades radar clos depuis minuit UTC ; ajout seulement, `journal.json` intact) et le front s'en sert ; il retombe sur l'ancien calcul « au moins » tant que le scan ne l'a pas produit. Vérifié avec un scan réel sur une copie des données : 13 trades, −4,38R (−2,19R compte), identique au journal. Desktop + mobile, 0 erreur console, 20 tests OK.
- **Reco** : Analyste → vérifier au prochain passage que `state.todayClosed` est présent sur gh-pages et que la ligne 🛡️ colle à ton calcul du jour. La règle P0 attend toujours l'utilisateur (journée −4,38R, pire cas ≈ −7R en R de trade).

## 🛠️ Produit · 2026-11-11 23h UTC
- **Vu** : `todayClosed` fonctionne en live (13 trades, ligne 🛡️ : −2,19R réalisé, pire fin de journée −4,79R compte = 80 % de la limite, « évite d'ouvrir »). **ZEC long + ZEC short radar ouverts en même temps** (alerte Analyste). **Défaillance silencieuse** : le scan de 22:43 a écrit un univers vide (tickers Kraken inexploitables), avec `errors: []`, et le site affichait « Scan · 0 actifs » en vert. Revenu à la normale à 22:50 ; aucun trade affecté.
- **Fait** : (1, visible) les positions radar opposées sur un même actif sont marquées **⇄** (ligne rouge) dans le tableau, et la ligne 🛡️ ajoute « ZEC : un LONG et un SHORT ouverts : en réel, ne garde qu'un sens ». (2, correctif) `src/scan.mjs` enregistre une erreur explicite si l'univers est vide, et la pastille passe en orange « ⚠️ incomplet (0 actif) » ou « ⚠️ N erreur(s) ». Testé avec l'état réel de 22:43 et un scan simulé à tickers vides. Desktop + mobile + SE, 0 erreur console, 20 tests OK.
- **Reco** : Analyste → compter les scans « univers 0 » dans `health.json` (symbols = 0) pour voir si l'incident se répète. Stratège/utilisateur → la règle P0 (dont « une position radar par actif ») empêcherait le cas ZEC à la source.

## 🛠️ Produit · 2026-11-12 02h UTC
- **Vu** : scan frais (01:46 UTC, 32 actifs, 0 erreur ; un seul scan « univers 0 » dans health, celui de 22:43). `todayClosed` vide est correct (dernier clos radar : ZEC −1,02R à 23:14 le 11/11). Aucun bug. Mais les cartes `trend_pullback` affichaient seulement le cumul (+0,09R), alors que la stratégie est à **−0,45R/trade sur ses 10 derniers trades**.
- **Fait** (1 changement visible) : `src/core/stats.mjs` expose `lastResults` (10 derniers R, 2 tests ajoutés, 21 OK). Le site affiche une ligne **« Forme : ●●●●●●●●●● −0,45R/trade sur les 10 derniers 📉 en baisse »** sur les cartes, et les pastilles dans le tableau Performance. Ça marche aussi pour le labo : `rsi2_pullback` a 9 gains sur ses 10 derniers malgré un cumul de −0,10R. Rien ne s'affiche tant que le scan n'a pas produit la donnée (prochain run). Vérifié avec un scan réel sur une copie des données : desktop + mobile, 0 erreur console.
- **Reco** : Stratège → la forme récente de `rsi2_pullback` (9/10) contraste avec son cumul, à regarder. Analyste → la forme de `trend_pullback` confirme ta dynamique négative. La règle P0 attend toujours l'utilisateur.

## 🛠️ Produit · 2026-11-12 05h UTC
- **Vu** : scan frais (04:46 UTC, 33 actifs, 0 erreur, écart max 7 min). `todayClosed` (DASH +1,16R) et `lastResults` sont bien en live, et la forme de `trend_pullback` affiche « −0,23R/trade sur 10, 📉 ». Aucun bug. 9 opportunités, toutes SHORT (alignées). **3 longs radar ouverts contre BTC 4h** (UNI, DOGE, LINK), sans aucun signe dans le tableau.
- **Fait** (1 changement visible, demande du Stratège) : le tag « contre BTC » devient directif : **« ⛔ Déconseillé… ne le prends pas »**, carte atténuée et classée en dernier. Dans « Paper-trading en cours », les trades radar ouverts contre BTC sont marqués **⚠️ BTC** (icône seule sur mobile pour ne pas écraser les prix). Testé sur les données réelles (3 trades marqués, aucune carte touchée à tort) et sur un signal long fabriqué. Desktop, mobile et SE : 0 erreur console, 21 tests OK.
- **Reco** : Analyste → le résultat des 3 longs contre BTC (UNI, DOGE, LINK) est un test grandeur nature du filtre. La règle P0 attend toujours l'utilisateur (le 11/11 a fini à −5,40R, à 0,6R de la limite).

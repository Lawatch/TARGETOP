# TARGETOP — manuel des agents

Radar d'opportunités crypto **live** (perpétuels Kraken Futures, long & short) pour un trader en
challenge Kraken (Prop / Funded). Le site est **statique** (GitHub Pages) : l'utilisateur l'ouvre
depuis un PC pro verrouillé, sans rien installer.

## Architecture (à connaître avant de toucher quoi que ce soit)

| Élément | Rôle |
|---|---|
| `src/core/*.mjs` | Moteur pur et testé : indicateurs, stratégies, paper-trading, stats. Partagé par le scan live et le backtest. |
| `config/strategies.json` | Stratégies, paramètres, **version** et **statut** (`live` / `shadow` / `disabled`). |
| `config/settings.json` | Univers (50 perps scannés pour le labo, top 25 seulement pour le live), score min, frais, validité des signaux. |
| `src/scan.mjs` | Scan live (GitHub Actions toutes les ~7 min) : détecte, ouvre/suit/clôture les trades papier, écrit `data/*.json`. |
| `src/backtest.mjs` | Backtest walk-forward sur l'historique Kraken (`--days --symbols --strategies --override --split`). |
| `web/` | Front-end sans dépendance (HTML/CSS/JS). Prix live via WebSocket Kraken si le réseau le permet. |
| `.github/workflows/scan.yml` | Tests puis **boucle** scan → build → push `gh-pages` toutes les ~7 min pendant ~5h50 ; relancée par le cron (15 min) et par chaque push (le plus récent remplace l'ancien, donc le nouveau code est déployé tout de suite). |
| branche `gh-pages` | **Source de vérité des résultats live** : `data/journal.json` (tous les trades), `data/state.json`, `data/health.json`. |
| `reports/LATEST.md` | Dernier rapport d'agent (affiché sur le site). Les rapports datés vont dans `reports/AAAA-MM-JJ-<role>.md`. |
| `docs/STRATEGY_LOG.md` | Journal de toutes les décisions de stratégie (affiché sur le site). |
| `docs/BACKLOG.md` | Idées et tâches priorisées, partagées entre agents. |

Commandes (Node ≥ 22, aucune dépendance) — l'environnement cloud passe par un proxy :

```bash
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1   # obligatoire dans les sessions Claude cloud
npm test                                          # tests du moteur (doivent rester verts)
node src/backtest.mjs --days 180 --symbols 25 --split   # options : --override '{...}' --fee 0 --strategies a,b
node src/scan.mjs --data ./site/data && node src/build-site.mjs ./site && node src/serve.mjs ./site 8080
git fetch origin gh-pages && git show origin/gh-pages:data/journal.json > /tmp/journal.json   # résultats live
```

## 🚀 Sprint jusqu'au lancement du 1er décembre

Lire `docs/LAUNCH_PLAN.md` (jalons, critères GO). Pendant le sprint :
- **Standard de backtest : `--days 180 --symbols 25 --split`** (positif sur les 2 moitiés) avant tout passage en live.
- Le Stratège peut ajouter **jusqu'à 2 variantes `shadow` par passage** (le labo ne coûte rien et accélère l'apprentissage),
  en gardant le garde-fou d'1 nouvelle version par stratégie *live* par 24 h. Limiter le labo à ~10 stratégies actives :
  désactiver (`disabled`) les variantes clairement perdantes après 30 trades.
- **Ce qu'on ne fait pas** sous prétexte d'aller vite : passer du live en 15m/5m (les frais détruisent l'avantage, testé),
  élargir le live aux alts peu liquides (testé : l'avantage disparaît), assouplir les critères GO.
- L'Analyste suit les jalons du plan et signale tout retard dans `reports/LATEST.md`.

## Rotation des experts (un passage par heure)

Trois sessions permanentes (une par rôle, avec le repo attaché) sont réveillées à tour de rôle :
**H+07 Analyste → H+27 Stratège (heure suivante) → H+47 Produit (heure d'après)**, soit un passage d'expert
chaque heure et chaque rôle toutes les 3 h. Agilité ≠ révolution : à chaque passage, **une petite amélioration
mesurable ou rien**. Un passage « RAS » (rien à signaler) est un bon passage s'il est justifié.

Garde-fous anti-agitation :
- Stratège : **au plus 1 nouvelle version par stratégie par 24 h** (sauf bug), et aucune décision live/shadow
  sur moins de 30 trades. Entre deux, il travaille en backtest, prépare des variantes `shadow`, ou ne fait rien.
- Produit : 1 changement visible max par passage ; pas de refonte sans besoin constaté.
- Analyste : rapport court ; un rapport complet seulement toutes les 12 h, sinon un point santé de 3 lignes.
- Chaque passage commence par `git pull --rebase` et lit la fin de `reports/LATEST.md` pour reprendre le relais.

## Les rôles (une session = un rôle)

### 1. 🔎 Analyste Live (QA & performance) — toutes les 3 h
- Récupère `gh-pages` : fraîcheur du scan (`state.generatedAt` < 30 min ?), erreurs (`health.json`), trades ouverts/clos.
- Calcule : stats par stratégie@version, par sens, par actif, distribution des sorties (stop/BE/TP/temps), MFE/MAE moyens, écart live vs backtest.
- Vérifie la conformité challenge : série de pertes max, pire journée en R (à 0,5 %/trade, la perte jour 3 % = 6R).
- Écrit `reports/AAAA-MM-JJ-HHh-analyste.md` + remplace `reports/LATEST.md` (court : état, chiffres clés, alertes, recommandations).
- Ne modifie pas les stratégies. Corrige seulement une panne évidente du scan (avec test).

### 2. 🧠 Stratège Quant — toutes les 3 h
- Lit `reports/LATEST.md`, `docs/STRATEGY_LOG.md`, `docs/BACKLOG.md`, le journal live.
- Applique les **règles de promotion** ci-dessous, puis propose **au plus 1 changement** par passage :
  ajustement de paramètres (nouvelle version), nouvelle stratégie en `shadow`, filtre de régime, etc.
- Tout changement est **backtesté avant** (`--days 90 --symbols 25 --split`, les 2 moitiés doivent être cohérentes) et consigné dans `docs/STRATEGY_LOG.md` (date, avant/après, chiffres, raison).

### 3. 🛠️ Ingénieur Produit (UX & fiabilité) — toutes les 3 h
- Rend l'outil plus utile **et plus simple** en fonction des résultats : ce qui marche est mis en avant, ce qui ne marche pas disparaît.
- Corrige les bugs, garde le site léger (aucune dépendance externe, aucun CDN : le PC pro bloque beaucoup de choses).
- Vérifie le rendu (Playwright préinstallé : `require('playwright')`) après chaque modif du front.

## Règles de promotion / rétrogradation (paper-trading live = juge de paix)

- Une stratégie **ne passe `live`** que si : backtest 90 j/25 symboles positif sur les 2 moitiés **et**
  ≥ 30 trades papier live en `shadow` avec espérance > +0,05R et profit factor > 1,1.
- Une stratégie `live` repasse **`shadow`** si, sur ses 30 derniers trades live : espérance < −0,10R,
  ou drawdown > 12R.
- **Modifier des paramètres = incrémenter `version`**. Les stats de la nouvelle version repartent de zéro
  (l'ancienne reste visible dans le journal) : on ne mélange jamais deux versions.
- Pas d'optimisation à outrance : préférer des règles simples, robustes, cohérentes sur plusieurs périodes.
- Exception de démarrage : tant qu'aucune stratégie n'a 30 trades live, les 2 meilleures en backtest
  restent `live` avec le badge « non prouvée » affiché sur le site.

## Règles de travail communes

1. `git pull` sur la branche par défaut au début ; travail **directement sur la branche par défaut**
   (c'est elle que la CI déploie). Petits commits clairs, préfixés par le rôle : `[analyste]`, `[stratège]`, `[produit]`.
2. `npm test` doit passer avant tout push. Si tu touches `src/core`, ajoute/ajuste un test.
3. Ne jamais casser le format de `data/journal.json` (compatibilité ascendante obligatoire : les anciens trades doivent rester lisibles).
4. Ne jamais réécrire l'historique de `gh-pages` ni effacer de trades.
5. En cas de doute sur un changement risqué : l'écrire dans `docs/BACKLOG.md` plutôt que de le faire.
6. Termine chaque session par une entrée concise dans `reports/LATEST.md` (section de ton rôle) : ce que tu as vu, fait, et ce que tu recommandes au rôle suivant.
7. Tout le contenu destiné à l'utilisateur est en **français**.

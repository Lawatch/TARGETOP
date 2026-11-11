# Leçons apprises (post-mortems)

Chaque stratégie coupée ou chaque échec notable a son entrée : hypothèse, résultat, cause probable, prochaine idée.
Le Stratège lit ce fichier avant d'inventer une nouvelle stratégie.

## 2026-11-10 — Ce que les premiers backtests ont appris
- **Le court terme (15m) ne marche pas avec les frais Kraken (0,05 %/côté)** : stops serrés ⇒ frais de 0,15-0,25R par trade. Hypothèse « plus de trades = plus de profit » fausse sans avantage par trade.
- **Les alts peu liquides détruisent l'avantage** : top 25 ≫ top 50 sur toutes les stratégies testées.
- **90 jours de backtest ne suffisent pas** : `failed_breakout` +0,12R sur 90 j, −0,05R sur 180 j (régime de marché).
- **Les cassures de range « naïves » perdent** (`breakout_volume` ≈ −0,25R) : beaucoup de fausses cassures sur les alts ; l'idée inverse (`failed_breakout`) est plus intéressante mais instable.
- **Suivi de tendance long avec stop suiveur** (`donchian_trend`, long seulement) : meilleure piste à ce jour (+0,14R, PF 1,23 sur 180 j) — gains rares mais gros. À surveiller : possible biais de marché haussier.
- **RSI(2) et compression de volatilité** : négatifs en 1h (−0,08R / −0,15R). Pistes à retravailler (filtre de régime, autre TF) ou abandonner.

## 2026-11-11 — Filtre de volatilité BTC sur `donchian_trend` : effet de fenêtre
- Hypothèse : le suivi de tendance a besoin de volatilité ; filtrer le tiers le plus calme (BTC) améliore l'espérance.
- Résultat : +0,16R → +0,31R sur 180 j le 10/11, mais le lendemain +0,15R → +0,29R avec une 1re moitié négative, et **+0,28R → +0,11R sur 90 j**.
- Cause probable : le gain venait d'une période précise (fin de l'été). Un filtre de régime choisi sur une seule fenêtre se sur-ajuste facilement.
- À faire ensuite : valider tout filtre sur 90 j et 180 j, et sur une date de fin décalée (ex. `--end` −30 j), avant de créer une version.

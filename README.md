# TARGETOP · Radar crypto live

Radar d'opportunités long/short sur les perpétuels **Kraken Futures**, pensé pour les challenges Kraken.
Site statique (GitHub Pages) : rien à installer, s'ouvre dans un navigateur.

- **Opportunités** : entrée, stop, TP1/TP2, score, raisons, taille de position selon ton capital et ton risque.
- **Paper-trading continu** : chaque signal est joué automatiquement pour mesurer la fiabilité réelle.
- **Amélioration continue** : des agents (Analyste, Stratège, Produit) se relaient. Voir [`AGENTS.md`](AGENTS.md).

```bash
npm test
NODE_USE_ENV_PROXY=1 node src/backtest.mjs --days 90 --symbols 25 --split
```

Outil d'aide à la décision, pas un conseil en investissement.

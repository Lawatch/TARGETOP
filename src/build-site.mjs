// Assemble le site statique : web/* + docs (rapport agents, journal stratégie) dans <dest>.
// Les données (data/state.json, journal.json, health.json) sont produites par src/scan.mjs dans <dest>/data.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dest = path.resolve(process.argv[2] || './site');
fs.mkdirSync(path.join(dest, 'data'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'web'))) fs.copyFileSync(path.join(root, 'web', f), path.join(dest, f));
const copyIf = (src, dst) => { const p = path.join(root, src); if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dest, 'data', dst)); };
copyIf('reports/LATEST.md', 'report.md');
copyIf('docs/STRATEGY_LOG.md', 'strategy-log.md');
let sha = process.env.GITHUB_SHA || '';
try { sha ||= execSync('git rev-parse HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
fs.writeFileSync(path.join(dest, 'data', 'version.json'), JSON.stringify({ sha, builtAt: Date.now() }));
fs.writeFileSync(path.join(dest, '.nojekyll'), '');
console.log('site assemblé dans', dest);

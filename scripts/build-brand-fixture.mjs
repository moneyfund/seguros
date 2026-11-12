import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Separate output, excluded from Vite's production input and dist.
const output = resolve('tests/brand/rendered');
await mkdir(output, { recursive: true });
await build({
  entryPoints: ['tests/brand/fixture.tsx'], bundle: true, format: 'esm', jsx: 'automatic',
  outdir: output, entryNames: 'fixture', define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  external: ['/fonts/*'],
  plugins: [{ name: 'offline-brand-fixture', setup(builder) {
    builder.onResolve({ filter: /^\.\/(backend|staff|firebase|pilotData|insuranceSeed)$/ }, () => ({ path: resolve('tests/brand/mock-services.ts') }));
  } }],
});
await writeFile(resolve(output, 'index.html'), '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ACOS · Prueba visual aislada</title><link rel="stylesheet" href="./fixture.css"></head><body><div id="root"></div><script type="module" src="./fixture.js"></script></body></html>');
console.log('Offline visual fixture: ' + output);

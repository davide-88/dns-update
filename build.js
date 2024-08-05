import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/route53/update-route53-record-run.ts'],
  bundle: true,
  outfile: './dist/update-route53-record-run.mjs',
  platform: 'node',
  target: 'node20',
  format: 'esm',
  mainFields: ['module', 'main'],
  sourcemap: true,
  treeShaking: true,
  minify: true,
  banner: {
    js: `import { createRequire as topLevelCreateRequire } from "node:module"; const require = topLevelCreateRequire(import.meta.url);`,
  },
});

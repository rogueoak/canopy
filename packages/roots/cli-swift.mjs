#!/usr/bin/env node
/**
 * `roots-swift` CLI (spec 0032) - a thin wrapper over `buildSwift()`.
 *
 * Usage:
 *   roots-swift [config.json] [--out <path>]
 *
 * Reuses the SAME brand config `roots-brand` reads:
 *   {
 *     "name": "thoughtstream",
 *     "primitives": "primitive.json",          // string or string[]
 *     "semantic": "semantic.json",             // light role mapping
 *     "semanticDark": "semantic.dark.json"     // dark role mapping
 *   }
 *
 * The Swift file lands at `dist/<brand>/Tokens.swift` in the roots package by default (a deliberate,
 * on-demand export - it is NOT part of the web `pnpm build`). Pass `--out` to redirect it. Relative
 * paths in the config resolve RELATIVE TO THE CONFIG FILE, so a brand folder is portable.
 */
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSwift, slugify } from './swift.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
let configArg;
let outOverride;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out' || a === '-o') outOverride = argv[++i];
  else if (a === '--help' || a === '-h') {
    console.log('Usage: roots-swift [config.json] [--out <path>]');
    process.exit(0);
  } else if (!a.startsWith('-')) configArg = a;
}

const configPath = resolve(process.cwd(), configArg ?? 'brand.config.json');
const configDir = dirname(configPath);
const rel = (p) => (isAbsolute(p) ? p : resolve(configDir, p));

const run = async () => {
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Cannot read brand config at ${configPath}: ${err.message}`);
  }
  const primitives = (
    Array.isArray(config.primitives) ? config.primitives : [config.primitives]
  ).map(rel);
  const slug = slugify(config.name) || 'brand';
  const defaultOut = resolve(here, 'dist', slug, 'Tokens.swift');
  const { outFile, roles } = await buildSwift({
    name: config.name,
    primitives,
    semantic: rel(config.semantic),
    semanticDark: rel(config.semanticDark),
    outFile: outOverride ? rel(outOverride) : defaultOut,
  });
  console.log(`roots-swift: wrote ${outFile} (${roles.length} semantic colors, light + dark).`);
};

run().catch((err) => {
  console.error(`roots-swift: ${err.message}`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * `roots-brand` CLI (spec 0028) - a thin wrapper over `buildBrand()`.
 *
 * Usage:
 *   roots-brand [config.json] [--out <path>]
 *
 * The config (default `./brand.config.json`) is JSON:
 *   {
 *     "name": "sunset",
 *     "primitives": "tokens/primitive.json",        // string or string[]
 *     "semantic": "tokens/semantic.json",            // light role mapping (Canopy role names)
 *     "semanticDark": "tokens/semantic.dark.json",   // dark role mapping
 *     "outFile": "dist/sunset.css",
 *     "scope": null                                  // null -> :root/.dark ; "sunset" -> .sunset/.sunset.dark
 *   }
 *
 * Relative paths in the config resolve RELATIVE TO THE CONFIG FILE, so a brand folder is portable.
 */
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { buildBrand } from './brand.mjs';

const argv = process.argv.slice(2);
let configArg;
let outOverride;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out' || a === '-o') outOverride = argv[++i];
  else if (a === '--help' || a === '-h') {
    console.log('Usage: roots-brand [config.json] [--out <path>]');
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
  const { outFile, roles, inherited } = await buildBrand({
    name: config.name,
    primitives,
    semantic: rel(config.semantic),
    semanticDark: rel(config.semanticDark),
    outFile: rel(outOverride ?? config.outFile),
    scope: config.scope ?? null,
  });
  const mapped = roles.length - inherited.light.length;
  const inheritedNote =
    inherited.light.length > 0 ? `, ${inherited.light.length} inherited from Canopy` : '';
  console.log(
    `roots-brand: wrote ${outFile} (${mapped}/${roles.length} semantic roles mapped${inheritedNote}, AA verified in light + dark).`,
  );
};

run().catch((err) => {
  console.error(`roots-brand: ${err.message}`);
  process.exit(1);
});

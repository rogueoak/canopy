// Thin fork of lib/dts.mjs for @rogueoak/canopy.
//
// Why: Canopy splits its ~60 public components across subpath exports
// (`@rogueoak/canopy/seeds` | `/twigs` | `/branches`) and declares each
// entry's types ONLY through the modern `exports` map — there is no legacy
// per-subpath `types` field and no physical subpath `package.json`. The
// stock `exportedNames`/`jsdocFor` read a single entry `.d.ts` resolved from
// `pkg.types`/`publishConfig.types`, so they see only the main (`seeds`)
// entry — 18 of 60 components — and drop the other 42 as [TITLE_UNMAPPED].
//
// This fork re-exports the stock module unchanged and overrides only the two
// entry-scoped readers to UNION the exports (and per-component JSDoc) across
// every `.d.ts` entry named in the package's `exports` map. Props already
// resolve project-wide (propsBodyFor scans the whole loaded `.d.ts` tree), so
// nothing else needs touching. Everything else — props extraction, style-
// system filtering, compound partitioning — still comes from the staged
// module and keeps getting its future improvements.
//
// Siblings stay in the staged scripts, so relative imports point back there;
// ts-morph resolves via the .design-sync/node_modules -> ../.ds-sync/node_modules
// symlink (recreated per clone).

import { existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { Node } from 'ts-morph';
import { findTypesRoot, loadDts } from '../../.ds-sync/lib/dts.mjs';

export * from '../../.ds-sync/lib/dts.mjs';

// Every `.d.ts` entry the package publishes: the `exports` map's `types`
// conditions (including a nested `import.types`), plus the legacy fields.
function typeEntryPaths(pkgDir, pkgJson) {
  const rels = [];
  const exp = pkgJson.exports;
  if (exp && typeof exp === 'object') {
    for (const val of Object.values(exp)) {
      if (!val || typeof val !== 'object') continue;
      if (typeof val.types === 'string') rels.push(val.types);
      if (val.import && typeof val.import === 'object' && typeof val.import.types === 'string') {
        rels.push(val.import.types);
      }
    }
  }
  if (typeof pkgJson.types === 'string') rels.push(pkgJson.types);
  if (typeof pkgJson.typings === 'string') rels.push(pkgJson.typings);
  const abs = [];
  for (const rel of rels) {
    const p = join(pkgDir, rel);
    if (existsSync(p)) abs.push(p);
  }
  return [...new Set(abs)];
}

// Resolve a type-entry path to its ts-morph SourceFile (paths are normalized,
// so fall back to a realpath match if the direct lookup misses).
function sourceFileFor(project, absPath) {
  const direct = project.getSourceFile(absPath);
  if (direct) return direct;
  let realTarget;
  try { realTarget = realpathSync(absPath); } catch { return undefined; }
  return project.getSourceFiles().find((sf) => {
    try { return realpathSync(sf.getFilePath()) === realTarget; } catch { return false; }
  });
}

function isValueDecl(d) {
  return Node.isVariableDeclaration(d) || Node.isFunctionDeclaration(d) ||
    Node.isClassDeclaration(d) || Node.isSourceFile(d);
}

// Union of PascalCase value exports across every published `.d.ts` entry.
export function exportedNames(pkgDir, pkgJson) {
  const names = new Set();
  let ctx;
  try { ctx = loadDts(findTypesRoot(pkgDir, pkgJson)); } catch { return names; }
  const { project } = ctx;
  const entries = typeEntryPaths(pkgDir, pkgJson);
  if (!entries.length && ctx.entry) entries.push(ctx.entry);
  for (const entryPath of entries) {
    const sf = sourceFileFor(project, entryPath);
    if (!sf) continue;
    for (const [name, decls] of sf.getExportedDeclarations()) {
      if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue;
      if (decls.some(isValueDecl)) names.add(name);
    }
  }
  return names;
}

function firstDocLine(decls) {
  const exp = decls.find((d) =>
    Node.isVariableDeclaration(d) || Node.isFunctionDeclaration(d) || Node.isClassDeclaration(d)) ?? decls[0];
  if (!exp || Node.isSourceFile(exp)) return '';
  const doc = exp.getJsDocs?.()?.[0]?.getDescription()
    ?? exp.getSymbol?.()?.compilerSymbol.getDocumentationComment?.(undefined)?.[0]?.text;
  if (!doc) return '';
  return doc.split('\n').find((l) => l.trim() && !l.trim().startsWith('@'))
    ?.trim().replace(/\s+/g, ' ').replace(/[^\w\s.,()'/:+-]/g, '').slice(0, 140) ?? '';
}

// One-line JSDoc, searched across every published `.d.ts` entry (the stock
// reader looks only at ctx.entry, so subpath components get no description).
export function jsdocFor(name, ctx) {
  const fromMain = ctx.project?.getSourceFile(ctx.entry)?.getExportedDeclarations().get(name);
  if (fromMain?.length) {
    const doc = firstDocLine(fromMain);
    if (doc) return doc;
  }
  const { project, pkgDir } = ctx;
  if (!project || !pkgDir) return '';
  for (const sf of project.getSourceFiles()) {
    const fp = sf.getFilePath();
    if (!fp.startsWith(pkgDir) || !/\/index\.d\.ts$/.test(fp)) continue;
    const decls = sf.getExportedDeclarations().get(name);
    if (!decls?.length) continue;
    const doc = firstDocLine(decls);
    if (doc) return doc;
  }
  return '';
}

// Thin fork of lib/css-fallback.mjs for @rogueoak/canopy.
//
// Why: Canopy's Storybook is React + Vite + Tailwind v4. Vite injects the
// compiled preview stylesheet (tokens + Tailwind utilities + font @font-face +
// video skin) through a JS import, so iframe.html carries NO
// `<link rel=stylesheet>` — the stock scrape finds nothing and falls back to a
// self-styling placeholder, leaving every preview unstyled. The compiled CSS
// is right there as `sb-reference/assets/preview-*.css` (~130 KB).
//
// This fork re-exports the stock module unchanged and overrides only
// `fallbackCssFromStorybook` to add a second source: when no local
// `<link rel=stylesheet>` exists, fall back to the largest compiled stylesheet
// under `<sbStatic>/assets`. Returning `assets/` as the srcDir also lets the
// stock extractFonts copy the referenced font files, same as the `<link>` path.
//
// Siblings stay in the staged scripts, so relative imports point back there.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { isPlaceholderCss } from '../../.ds-sync/lib/css-fallback.mjs';

export * from '../../.ds-sync/lib/css-fallback.mjs';

// Local <link rel=stylesheet> hrefs (the stock source), resolved to disk.
function linkedStylesheets(iframeHtml, sbStatic) {
  return [...iframeHtml.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /\brel\s*=\s*["']stylesheet["']/i.test(t))
    .map((t) => t.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1])
    .filter((h) => h && !/^(https?:|\/\/)/.test(h))
    .map((h) => join(sbStatic, h.replace(/^\.\//, '')))
    .filter((p) => p.startsWith(sbStatic + sep) && existsSync(p));
}

// Vite/JS-injected fallback: compiled stylesheets emitted under assets/.
function assetStylesheets(sbStatic) {
  const dir = join(sbStatic, 'assets');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => join(dir, f))
    .filter((p) => existsSync(p));
}

export function fallbackCssFromStorybook({ bundleCss, sbStatic, out }) {
  if ((existsSync(bundleCss) && !isPlaceholderCss(bundleCss)) || !sbStatic || !existsSync(join(sbStatic, 'iframe.html'))) {
    return null;
  }
  const iframeHtml = readFileSync(join(sbStatic, 'iframe.html'), 'utf8');
  let candidates = linkedStylesheets(iframeHtml, sbStatic);
  let via = 'iframe <link>';
  if (!candidates.length) {
    candidates = assetStylesheets(sbStatic);
    via = 'assets/*.css (Vite JS-injected preview stylesheet)';
  }
  candidates.sort((a, b) => statSync(b).size - statSync(a).size);
  const chosen = candidates[0];
  if (chosen) {
    const was = existsSync(bundleCss) ? `a ${statSync(bundleCss).size}B placeholder` : 'missing';
    const kb = (statSync(chosen).size / 1024).toFixed(0);
    const srcDir = dirname(chosen);
    const css = readFileSync(chosen, 'utf8');
    const assets = [...new Set(
      [...css.matchAll(/url\(\s*(['"]?)(?!data:|https?:|\/\/|\/)([^'")]+)\1\s*\)/gi)].map((m) => m[2]),
    )];
    writeFileSync(bundleCss, css);
    console.error(`[CSS_FROM_STORYBOOK] _ds_bundle.css was ${was} — replaced with ${relative(out, chosen)} (${kb} KB) via ${via}.`);
    if (assets.length) {
      console.error(`[CSS_ASSETS] ${assets.length} relative url() ref(s) in the fallback CSS won't resolve post-upload (fonts are copied separately via extractFonts; images will 404): ${assets.slice(0, 5).join(', ')}${assets.length > 5 ? ', …' : ''}`);
    }
    return srcDir;
  }
  console.error(`[CSS_PLACEHOLDER] _ds_bundle.css is missing or a stub (@import-only, <500B) and no storybook CSS found to fall back to — set cfg.cssEntry to the compiled stylesheet.`);
  return null;
}

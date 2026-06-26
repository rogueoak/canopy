import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { tokens } from '@rogueoak/roots';

/**
 * Foundations — the living spec for Canopy Roots (spec 0003, theming added in 0004).
 *
 * Every swatch/sample is driven by the generated Roots tokens: Tailwind utilities
 * (backed by the @theme preset) where a utility exists, and the runtime CSS vars /
 * typed TS export otherwise. Stories read correctly in BOTH themes — toggle Light/Dark
 * in the toolbar (`.dark` on <html> remaps the semantic vars; see the Theme story).
 */

const RAMP_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const RAMPS = ['moss', 'bark', 'stone', 'amber', 'success', 'warning', 'danger', 'info'] as const;

const wrap: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  padding: '2rem',
};

const h2: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text-subtle)',
  fontWeight: 600,
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: '0.5rem',
  margin: '0 0 1.25rem',
};

const tokenVal = (name: string) => (tokens as Record<string, string>)[name];

/* ------------------------------------------------------------------ Colours */

function Ramp({ name }: { name: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.375rem' }}>
        {name}
      </div>
      <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {RAMP_STEPS.map((step) => {
          const hex = tokenVal(`color-${name}-${step}`);
          const dark = Number(step) >= 500;
          return (
            <div
              key={step}
              title={`${name}-${step} ${hex}`}
              style={{
                flex: 1,
                height: 56,
                background: `var(--color-${name}-${step})`,
                color: dark ? 'rgba(255,255,255,.92)' : 'rgba(0,0,0,.66)',
                fontSize: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '4px 5px',
                lineHeight: 1.2,
              }}
            >
              <span style={{ fontWeight: 600 }}>{step}</span>
              <span style={{ opacity: 0.85 }}>{hex}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SEMANTIC_GROUPS: { group: string; tokens: { name: string; util?: string }[] }[] = [
  {
    group: 'Surfaces',
    tokens: [
      { name: 'bg', util: 'bg-bg' },
      { name: 'surface', util: 'bg-surface' },
      { name: 'surface-raised', util: 'bg-surface-raised' },
      { name: 'muted', util: 'bg-muted' },
    ],
  },
  {
    group: 'Text',
    tokens: [
      { name: 'text', util: 'bg-text' },
      { name: 'text-muted', util: 'bg-text-muted' },
      { name: 'text-subtle', util: 'bg-text-subtle' },
      { name: 'text-inverted', util: 'bg-text-inverted' },
    ],
  },
  {
    group: 'Lines',
    tokens: [
      { name: 'border', util: 'bg-border' },
      { name: 'border-strong', util: 'bg-border-strong' },
      { name: 'ring', util: 'bg-ring' },
      { name: 'ring-offset', util: 'bg-ring-offset' },
    ],
  },
  {
    group: 'Roles',
    tokens: [
      { name: 'primary', util: 'bg-primary' },
      { name: 'primary-foreground', util: 'bg-primary-foreground' },
      { name: 'secondary', util: 'bg-secondary' },
      { name: 'secondary-foreground', util: 'bg-secondary-foreground' },
      { name: 'accent', util: 'bg-accent' },
      { name: 'accent-strong', util: 'bg-accent-strong' },
      { name: 'accent-foreground', util: 'bg-accent-foreground' },
      { name: 'muted-foreground', util: 'bg-muted-foreground' },
    ],
  },
  {
    group: 'Interaction states',
    tokens: [
      { name: 'primary-hover', util: 'bg-primary-hover' },
      { name: 'primary-active', util: 'bg-primary-active' },
      { name: 'secondary-hover', util: 'bg-secondary-hover' },
      { name: 'secondary-active', util: 'bg-secondary-active' },
      { name: 'accent-hover', util: 'bg-accent-hover' },
      { name: 'muted-raised', util: 'bg-muted-raised' },
      { name: 'danger-hover', util: 'bg-danger-hover' },
      { name: 'danger-active', util: 'bg-danger-active' },
      { name: 'disabled', util: 'bg-disabled' },
      { name: 'disabled-foreground', util: 'bg-disabled-foreground' },
    ],
  },
  {
    group: 'Status',
    tokens: [
      { name: 'success', util: 'bg-success' },
      { name: 'success-foreground', util: 'bg-success-foreground' },
      { name: 'warning', util: 'bg-warning' },
      { name: 'warning-foreground', util: 'bg-warning-foreground' },
      { name: 'danger', util: 'bg-danger' },
      { name: 'danger-foreground', util: 'bg-danger-foreground' },
      { name: 'info', util: 'bg-info' },
      { name: 'info-foreground', util: 'bg-info-foreground' },
    ],
  },
];

// Read the swatch's LIVE computed colour so the hex label is accurate in BOTH themes
// (the fill already flips via the runtime var; this makes the printed value flip too).
// rgb→hex; re-reads whenever the `.dark` class on <html> changes.
const rgbToHex = (rgb: string): string => {
  const m = /rgba?\(([^)]+)\)/.exec(rgb);
  if (!m) return rgb;
  const [r, g, b] = m[1].split(',').map((p) => parseInt(p.trim(), 10));
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
};

function SemanticSwatch({ name, util }: { name: string; util?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(tokenVal(`color-${name}`));
  useEffect(() => {
    const read = () => {
      if (ref.current) setHex(rgbToHex(getComputedStyle(ref.current).backgroundColor));
    };
    read();
    // Re-read when the theme class on <html> toggles.
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [name]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div
        ref={ref}
        className={util}
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
          color-{name}
        </code>
        <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>{hex}</div>
      </div>
    </div>
  );
}

function Colours() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Primitive ramps (50 → 950)</h2>
      {RAMPS.map((r) => (
        <Ramp key={r} name={r} />
      ))}
      <h2 style={{ ...h2, marginTop: '2.5rem' }}>Semantic tokens</h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginTop: 0,
          maxWidth: 640,
        }}
      >
        Each hex below is read LIVE from the rendered swatch, so it reflects the active theme —
        toggle Light/Dark in the toolbar and the values flip with the fills. On light,{' '}
        <code>accent</code> (amber.500) is a <strong>fill-only</strong> role — ~2.83:1 on{' '}
        <code>bg</code>, below AA for text; use <code>accent-strong</code> (amber.700, ~6.15:1) for
        accent <strong>text / icon / border</strong>.
      </p>
      {SEMANTIC_GROUPS.map((g) => (
        <div key={g.group} style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {g.group}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.875rem',
            }}
          >
            {g.tokens.map((t) => (
              <SemanticSwatch key={t.name} {...t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Typography */

const TYPE_SCALE = [
  ['6xl', 'text-6xl'],
  ['5xl', 'text-5xl'],
  ['4xl', 'text-4xl'],
  ['3xl', 'text-3xl'],
  ['2xl', 'text-2xl'],
  ['xl', 'text-xl'],
  ['lg', 'text-lg'],
  ['base', 'text-base'],
  ['sm', 'text-sm'],
  ['xs', 'text-xs'],
] as const;

const WEIGHTS = [
  ['normal', 'font-normal', 400],
  ['medium', 'font-medium', 500],
  ['semibold', 'font-semibold', 600],
  ['bold', 'font-bold', 700],
] as const;

// Semantic text roles — each `text-<role>` utility applies font-size + line-height +
// font-weight (+ letter-spacing) in one class. Tailwind v4's text-* utility does NOT
// expand a font-family companion, so the `code` role pairs `text-code font-mono` (the
// role token still carries --text-code--font-family for native/non-Tailwind consumers).
// Full literal class names so Tailwind v4's scanner emits each utility (see Radii note).
const TEXT_ROLES: [string, string, string][] = [
  ['display', 'text-display font-sans', 'Grow something calm'],
  ['h1', 'text-h1 font-sans', 'Grow something calm'],
  ['h2', 'text-h2 font-sans', 'Grow something calm'],
  ['h3', 'text-h3 font-sans', 'Grow something calm'],
  ['h4', 'text-h4 font-sans', 'Grow something calm'],
  ['body', 'text-body font-sans', 'Canopy is a calm, natural design system for product UI.'],
  ['body-sm', 'text-body-sm font-sans', 'Canopy is a calm, natural design system for product UI.'],
  ['label', 'text-label font-sans', 'Field label'],
  ['caption', 'text-caption font-sans', 'Caption / fine print'],
  ['code', 'text-code font-mono', "tokens['color-primary']"],
];

function Typography() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Figtree — specimen</h2>
      <div className="font-sans" style={{ marginBottom: '2rem' }}>
        <div className="text-5xl font-bold" style={{ letterSpacing: 'var(--tracking-tight)' }}>
          The quick brown fox
        </div>
        <div className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          Figtree (variable) · self-hosted via @fontsource-variable/figtree
        </div>
        <div className="text-base" style={{ marginTop: '0.75rem', maxWidth: 560 }}>
          Canopy&apos;s UI sans. ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          &mdash; muted, natural, modern-minimal.
        </div>
      </div>

      <h2 style={h2}>Type scale (text-* utilities)</h2>
      <div style={{ marginBottom: '2rem' }}>
        {TYPE_SCALE.map(([name, util]) => (
          <div
            key={name}
            style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}
          >
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-subtle)',
                width: 96,
                flexShrink: 0,
              }}
            >
              {util} · {tokenVal(`text-${name}`)}
            </code>
            <span className={`${util} font-sans`}>Grow something</span>
          </div>
        ))}
      </div>

      <h2 style={h2}>Semantic text roles (text-* role utilities)</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 0 }}>
        Each role composes references to the type primitives, so one utility (e.g.{' '}
        <code>text-h2</code>) applies font-size, line-height, weight and tracking together.
        Components style against these, never raw scale + weight + leading.
      </p>
      <div style={{ marginBottom: '2rem' }}>
        {TEXT_ROLES.map(([name, cls, sample]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '1rem',
              marginBottom: '0.75rem',
            }}
          >
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-subtle)',
                width: 96,
                flexShrink: 0,
              }}
            >
              text-{name}
            </code>
            <span className={cls}>{sample}</span>
          </div>
        ))}
      </div>

      <h2 style={h2}>Weights</h2>
      <div style={{ marginBottom: '2rem' }}>
        {WEIGHTS.map(([name, util, val]) => (
          <div
            key={name}
            className={`text-2xl font-sans ${util}`}
            style={{ marginBottom: '0.25rem' }}
          >
            {name} ({val}) — Roots
          </div>
        ))}
      </div>

      <h2 style={h2}>Leading &amp; tracking</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {(
          [
            ['tight', 'font-sans leading-tight'],
            ['snug', 'font-sans leading-snug'],
            ['normal', 'font-sans leading-normal'],
            ['relaxed', 'font-sans leading-relaxed'],
          ] as const
        ).map(([l, cls]) => (
          <div key={l} className={cls} style={{ maxWidth: 280 }}>
            <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)' }}>
              leading-{l}
            </code>
            <p style={{ margin: '0.25rem 0 0' }}>
              Canopy is a calm, natural design system. This paragraph shows the line-height token.
            </p>
          </div>
        ))}
      </div>

      <h2 style={h2}>Geist Mono — code</h2>
      <pre
        className="font-mono text-sm"
        style={{
          background: 'var(--color-muted)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          margin: 0,
        }}
      >
        {`import { tokens } from '@rogueoak/roots';\nconst primary = tokens['color-primary']; // ${tokenVal('color-primary')}`}
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ Spacing */

const SPACES = [
  '0',
  '0.5',
  '1',
  '1.5',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
  '16',
  '20',
  '24',
  '32',
];

function Spacing() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Spacing scale (4px base)</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 0 }}>
        Tailwind utilities (<code>p-*</code>, <code>gap-*</code>) derive from a single{' '}
        <code>--spacing: 0.25rem</code> base. The <code>--space-*</code> vars below are for direct{' '}
        <code>var()</code> use.
      </p>
      {SPACES.map((s) => (
        <div
          key={s}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 6 }}
        >
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              width: 120,
              color: 'var(--color-text-subtle)',
            }}
          >
            space-{s} · {tokenVal(`space-${s}`)}
          </code>
          <div
            style={{
              height: 16,
              width: `var(--space-${s})`,
              background: 'var(--color-primary)',
              borderRadius: 2,
            }}
          />
        </div>
      ))}
      <h2 style={{ ...h2, marginTop: '2rem' }}>Tailwind p-* (from --spacing base)</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {['p-1', 'p-2', 'p-4', 'p-6', 'p-8'].map((p) => (
          <div
            key={p}
            className={p}
            style={{ background: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}
          >
            <div
              style={{ background: 'var(--color-primary)', width: 40, height: 40, borderRadius: 4 }}
            />
            <code style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>{p}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Radii */

// Full literal class names so Tailwind v4's source scanner emits each utility
// (dynamic `rounded-${r}` strings are NOT detected).
const RADII: [string, string][] = [
  ['none', 'rounded-none'],
  ['sm', 'rounded-sm'],
  ['md', 'rounded-md'],
  ['lg', 'rounded-lg'],
  ['xl', 'rounded-xl'],
  ['2xl', 'rounded-2xl'],
  ['full', 'rounded-full'],
];

function Radii() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Radii (rounded-* utilities)</h2>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {RADII.map(([r, cls]) => (
          <div key={r} style={{ textAlign: 'center' }}>
            <div
              className={cls}
              style={{
                width: 72,
                height: 72,
                background: 'var(--color-primary)',
                marginBottom: 6,
              }}
            />
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
              rounded-{r}
            </code>
            <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
              {tokenVal(`radius-${r}`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Elevation */

// Full literal class names (see Radii note).
const SHADOWS: [string, string][] = [
  ['sm', 'shadow-sm rounded-lg'],
  ['md', 'shadow-md rounded-lg'],
  ['lg', 'shadow-lg rounded-lg'],
  ['xl', 'shadow-xl rounded-lg'],
];

function Elevation() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Elevation (shadow-* utilities)</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {SHADOWS.map(([s, cls]) => (
          <div
            key={s}
            className={cls}
            style={{
              width: 140,
              height: 96,
              background: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
              shadow-{s}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Motion */

const EASES = ['standard', 'emphasized', 'decelerate'];
const DURATIONS = ['fast', 'base', 'slow'];

function Motion() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Motion — durations &amp; easing</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 0 }}>
        Hover a bar to play its easing/duration token.
      </p>
      <style>{`
        .motion-row { display:flex; align-items:center; gap:1rem; margin-bottom:0.75rem; }
        .motion-track { flex:1; max-width:420px; height:36px; background:var(--color-muted);
          border-radius:var(--radius-md); position:relative; overflow:hidden; }
        .motion-dot { position:absolute; top:6px; left:6px; width:24px; height:24px;
          border-radius:var(--radius-full); background:var(--color-primary);
          transition-property:transform; }
        .motion-track:hover .motion-dot { transform:translateX(360px); }
      `}</style>
      {EASES.map((e, i) => (
        <div className="motion-row" key={e}>
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              width: 220,
              color: 'var(--color-text-subtle)',
            }}
          >
            ease-{e} · duration-{DURATIONS[i]} ({tokenVal(`duration-${DURATIONS[i]}`)})
          </code>
          <div className="motion-track">
            <div
              className="motion-dot"
              style={{
                transitionTimingFunction: `var(--ease-${e})`,
                transitionDuration: `var(--duration-${DURATIONS[i]})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Contrast */

// [label, foreground role var, background role var, min ratio]. min 3.0 = AA Large
// (text-subtle is large-text-only); everything else is AA-normal (4.5). Ratios are
// COMPUTED LIVE from the resolved CSS vars at render — so the numbers (and pass/fail)
// flip with the theme instead of being hardcoded light-only strings (feedback 0003).
const CONTRAST_PAIRS: [string, string, string, number][] = [
  ['text on bg', 'color-text', 'color-bg', 4.5],
  ['text on surface', 'color-text', 'color-surface', 4.5],
  ['text-muted on surface', 'color-text-muted', 'color-surface', 4.5],
  ['text-muted on bg', 'color-text-muted', 'color-bg', 4.5],
  ['text-subtle on surface', 'color-text-subtle', 'color-surface', 3.0],
  ['text-subtle on bg', 'color-text-subtle', 'color-bg', 3.0],
  ['primary-foreground on primary', 'color-primary-foreground', 'color-primary', 4.5],
  ['secondary-foreground on secondary', 'color-secondary-foreground', 'color-secondary', 4.5],
  ['accent-foreground on accent', 'color-accent-foreground', 'color-accent', 4.5],
  ['accent-strong on bg (fg use)', 'color-accent-strong', 'color-bg', 4.5],
  ['muted-foreground on muted', 'color-muted-foreground', 'color-muted', 4.5],
  ['success-foreground on success', 'color-success-foreground', 'color-success', 4.5],
  ['warning-foreground on warning', 'color-warning-foreground', 'color-warning', 4.5],
  ['danger-foreground on danger', 'color-danger-foreground', 'color-danger', 4.5],
  ['info-foreground on info', 'color-info-foreground', 'color-info', 4.5],
];

// sRGB → relative luminance → WCAG 2.1 contrast ratio. Mirrors the executable guard in
// roots/tokens.test.ts so the story documents the same numbers the build asserts.
const srgbToLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminanceRGB = (r: number, g: number, b: number) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
const parseRGB = (rgb: string): [number, number, number] => {
  const m = /rgba?\(([^)]+)\)/.exec(rgb);
  if (!m) return [0, 0, 0];
  const [r, g, b] = m[1].split(',').map((p) => parseInt(p.trim(), 10));
  return [r, g, b];
};
const contrastRatio = (a: string, b: string) => {
  const la = luminanceRGB(...parseRGB(a));
  const lb = luminanceRGB(...parseRGB(b));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

type Row = { pair: string; ratio: number; min: number };

function Contrast() {
  // A hidden probe whose color/background we set to each role var, then read the resolved
  // rgb() back via getComputedStyle — so the ratio reflects the ACTIVE theme. Recomputes
  // when the `.dark` class on <html> toggles (same MutationObserver pattern as swatches).
  const probe = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    const resolve = (roleVar: string) => {
      el.style.color = `var(--${roleVar})`;
      return getComputedStyle(el).color;
    };
    const compute = () => {
      setRows(
        CONTRAST_PAIRS.map(([pair, fg, bg, min]) => ({
          pair,
          min,
          ratio: contrastRatio(resolve(fg), resolve(bg)),
        })),
      );
    };
    compute();
    const obs = new MutationObserver(compute);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={wrap}>
      <div ref={probe} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
      <h2 style={h2}>WCAG AA contrast — text roles</h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginTop: 0,
          maxWidth: 640,
        }}
      >
        Ratios are computed LIVE from the resolved tokens of the active theme — toggle Light/Dark in
        the toolbar and the numbers (and pass/fail) flip with the tokens. <code>text-subtle</code>{' '}
        (tertiary text — captions, placeholders) is held to AA-Large (≥ 3:1); every other pair to
        AA-normal (≥ 4.5:1).
      </p>
      <table style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ padding: '6px 16px 6px 0' }}>Pair</th>
            <th style={{ padding: '6px 16px' }}>Ratio</th>
            <th style={{ padding: '6px 0' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ pair, ratio, min }) => {
            const pass = ratio >= min;
            const label = pass ? (min === 3.0 ? 'AA Large' : 'AA') : 'FAIL';
            return (
              <tr key={pair} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td
                  style={{
                    padding: '6px 16px 6px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {pair}
                </td>
                <td style={{ padding: '6px 16px' }}>{ratio.toFixed(2)}:1</td>
                <td
                  style={{
                    padding: '6px 0',
                    color: pass ? 'var(--color-success)' : 'var(--color-danger)',
                    fontWeight: 600,
                  }}
                >
                  {label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------- Theme */

// A small UI built ENTIRELY from semantic utilities / vars (no per-theme code). Toggle
// the toolbar Light/Dark control: `.dark` on <html> overrides the semantic runtime vars,
// so every surface/text/role/state below re-resolves automatically. This is the 0004
// proof — re-theming with only the `.dark` class.
function ThemeDemo() {
  return (
    <div style={wrap}>
      <h2 style={h2}>Theme — one class re-themes everything</h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginTop: 0,
          maxWidth: 640,
        }}
      >
        Flip the <strong>Light / Dark</strong> toggle in the toolbar. Nothing below has per-theme
        code — every colour is a semantic token (<code>bg-surface</code>, <code>text-default</code>,{' '}
        <code>bg-primary</code>, the interaction-state and status roles). Toggling{' '}
        <code>.dark</code> on <code>&lt;html&gt;</code> remaps the semantic vars, so the whole card
        re-themes.
      </p>

      <div
        style={{
          maxWidth: 520,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '1.5rem',
        }}
      >
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-text)' }}>
          Project moss
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
          A calm, natural surface. Body copy uses <code>text-muted</code>; this fine print uses{' '}
          <span style={{ color: 'var(--color-text-subtle)' }}>text-subtle</span>.
        </p>

        {/* Role buttons — fills + foregrounds + a hover swatch, all semantic. */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Primary
          </span>
          <span
            style={{
              background: 'var(--color-secondary)',
              color: 'var(--color-secondary-foreground)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Secondary
          </span>
          <span
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-foreground)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Accent
          </span>
          <span
            style={{
              background: 'var(--color-disabled)',
              color: 'var(--color-disabled-foreground)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Disabled
          </span>
        </div>

        {/* Interaction-state ramp (base → hover → active), per role. */}
        <div style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-subtle)',
              marginBottom: 4,
            }}
          >
            Interaction states (base · hover · active)
          </div>
          {(
            [
              ['primary', ['primary', 'primary-hover', 'primary-active']],
              ['secondary', ['secondary', 'secondary-hover', 'secondary-active']],
            ] as const
          ).map(([role, steps]) => (
            <div
              key={role}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
            >
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  width: 80,
                  color: 'var(--color-text-subtle)',
                }}
              >
                {role}
              </code>
              {steps.map((s) => (
                <div
                  key={s}
                  title={`color-${s}`}
                  style={{
                    width: 48,
                    height: 28,
                    background: `var(--color-${s})`,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Status row. */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          {(['success', 'warning', 'danger', 'info'] as const).map((s) => (
            <span
              key={s}
              style={{
                background: `var(--color-${s})`,
                color: `var(--color-${s}-foreground)`,
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Story wiring */

const meta = {
  title: 'Foundations',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Theme_: Story = { name: 'Theme', render: () => <ThemeDemo /> };
export const Colours_: Story = { name: 'Colours', render: () => <Colours /> };
export const Typography_: Story = { name: 'Typography', render: () => <Typography /> };
export const Spacing_: Story = { name: 'Spacing', render: () => <Spacing /> };
export const Radii_: Story = { name: 'Radii', render: () => <Radii /> };
export const Elevation_: Story = { name: 'Elevation', render: () => <Elevation /> };
export const Motion_: Story = { name: 'Motion', render: () => <Motion /> };
export const Contrast_: Story = { name: 'Contrast', render: () => <Contrast /> };

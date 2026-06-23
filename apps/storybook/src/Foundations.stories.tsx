import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '@rogueoak/roots';

/**
 * Foundations — the living spec for Canopy Roots (spec 0003).
 *
 * Every swatch/sample is driven by the generated Roots tokens: Tailwind utilities
 * (backed by the @theme preset) where a utility exists, and the runtime CSS vars /
 * typed TS export otherwise. Light theme only — dark values land in 0004.
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
      { name: 'accent-foreground', util: 'bg-accent-foreground' },
      { name: 'muted-foreground', util: 'bg-muted-foreground' },
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

function SemanticSwatch({ name, util }: { name: string; util?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div
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
        <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
          {tokenVal(`color-${name}`)}
        </div>
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
      <h2 style={{ ...h2, marginTop: '2.5rem' }}>Semantic tokens (light)</h2>
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

const CONTRAST: [string, string, string][] = [
  ['text on bg', '12.39', 'AA'],
  ['text on surface', '13.49', 'AA'],
  ['text-muted on surface', '5.94', 'AA'],
  ['text-muted on bg', '5.45', 'AA'],
  ['text-subtle on surface', '4.12', 'AA Large'],
  ['text-subtle on bg', '3.79', 'AA Large'],
  ['primary-foreground on primary', '5.66', 'AA'],
  ['secondary-foreground on secondary', '5.67', 'AA'],
  ['accent-foreground on accent', '5.52', 'AA'],
  ['muted-foreground on muted', '4.94', 'AA'],
  ['success-foreground on success', '4.81', 'AA'],
  ['warning-foreground on warning', '4.95', 'AA'],
  ['danger-foreground on danger', '6.78', 'AA'],
  ['info-foreground on info', '6.61', 'AA'],
];

function Contrast() {
  return (
    <div style={wrap}>
      <h2 style={h2}>WCAG AA contrast — text roles</h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginTop: 0,
          maxWidth: 640,
        }}
      >
        All primary text roles meet WCAG 2.1 AA (≥ 4.5:1) on their intended surfaces.{' '}
        <code>text-subtle</code> (tertiary text — captions, placeholders) meets AA for large /
        non-essential text (≥ 3:1); use it only at ≥ 18.66px or ≥ 14px bold for AA-normal contexts.
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
          {CONTRAST.map(([pair, ratio, res]) => (
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
              <td style={{ padding: '6px 16px' }}>{ratio}:1</td>
              <td
                style={{
                  padding: '6px 0',
                  color: res === 'AA' ? 'var(--color-success)' : 'var(--color-warning)',
                  fontWeight: 600,
                }}
              >
                {res}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

export const Colours_: Story = { name: 'Colours', render: () => <Colours /> };
export const Typography_: Story = { name: 'Typography', render: () => <Typography /> };
export const Spacing_: Story = { name: 'Spacing', render: () => <Spacing /> };
export const Radii_: Story = { name: 'Radii', render: () => <Radii /> };
export const Elevation_: Story = { name: 'Elevation', render: () => <Elevation /> };
export const Motion_: Story = { name: 'Motion', render: () => <Motion /> };
export const Contrast_: Story = { name: 'Contrast', render: () => <Contrast /> };

import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Icon, IconProvider, iconRegistry, iconNames, Home } from '@rogueoak/icons';

/**
 * Icons - the curated Canopy icon set (spec 0027), the @rogueoak/icons package.
 *
 * Standard glyphs are Lucide; the social marks are Font Awesome 6 brands. Icons render in
 * `currentColor` and at `1em` by default, so they inherit the surrounding text colour and scale -
 * toggle the toolbar Light / Dark control and the whole catalog re-themes with no per-icon code.
 *
 * The catalog is driven by `iconRegistry` (the same data the package exports), so what you see
 * here is exactly what `import { Name } from '@rogueoak/icons'` gives you.
 */
const meta = {
  title: 'Icons/Catalog',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  padding: '2rem',
  minHeight: '100vh',
};

const SOCIAL = new Set(['Github', 'Linkedin', 'X', 'Facebook', 'Instagram', 'Threads']);

/* ------------------------------------------------------------------ Catalog */

function IconCard({ name }: { name: string }) {
  const Glyph = iconRegistry[name]!;
  return (
    <div
      title={name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '1rem 0.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <Glyph size="1.75rem" aria-hidden />
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-subtle)',
          textAlign: 'center',
          wordBreak: 'break-word',
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>
    </div>
  );
}

function IconGrid({ names }: { names: string[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {names.map((name) => (
        <IconCard key={name} name={name} />
      ))}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text-subtle)',
  fontWeight: 600,
  margin: '0 0 1rem',
};

/**
 * The full catalog with a live filter. State lives in this named component (not the story
 * `render` callback), per the Rules-of-Hooks constraint for stories.
 */
function IconCatalog() {
  const [query, setQuery] = useState('');
  const social = useMemo(() => iconNames.filter((n) => SOCIAL.has(n)), []);
  const standard = useMemo(() => iconNames.filter((n) => !SOCIAL.has(n)), []);
  const q = query.trim().toLowerCase();
  const match = (n: string) => n.toLowerCase().includes(q);
  const filteredStandard = standard.filter(match);
  const filteredSocial = social.filter(match);
  const total = filteredStandard.length + filteredSocial.length;

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="search"
          placeholder="Filter icons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 320,
            padding: '0.5rem 0.75rem',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-subtle)' }}>
          {total} of {iconNames.length}
        </span>
      </div>

      {filteredSocial.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={sectionTitle}>Social</h2>
          <IconGrid names={filteredSocial} />
        </section>
      )}
      {filteredStandard.length > 0 && (
        <section>
          <h2 style={sectionTitle}>Standard</h2>
          <IconGrid names={filteredStandard} />
        </section>
      )}
      {total === 0 && (
        <p style={{ color: 'var(--color-text-subtle)' }}>No icons match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}

export const Catalog: Story = {
  render: () => <IconCatalog />,
};

/* ------------------------------------------------------------------- Sizing */

export const Sizing: Story = {
  name: 'Sizing & colour',
  render: () => (
    <div style={wrap}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-subtle)', marginTop: 0 }}>
        Icons default to <code>1em</code> / <code>currentColor</code>, so they scale and colour with
        the surrounding text. Override with the <code>size</code> prop, a <code>className</code>, or
        the inherited text colour.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Home size="1rem" />
        <Home size="1.5rem" />
        <Home size="2rem" />
        <Home size="3rem" />
        <span style={{ color: 'var(--color-primary)' }}>
          <Home size="2rem" />
        </span>
        <span style={{ color: 'var(--color-danger)' }}>
          <Home size="2rem" />
        </span>
      </div>
    </div>
  ),
};

/* ----------------------------------------------------------- The Icon wrapper */

export const Wrapper: Story = {
  name: 'Icon wrapper & a11y',
  render: () => (
    <div style={wrap}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-subtle)', marginTop: 0 }}>
        <code>Icon</code> applies the default size and the right accessibility semantics: decorative
        by default (<code>aria-hidden</code>), or a labelled <code>role=&quot;img&quot;</code> when
        given a <code>title</code>. <code>IconProvider</code> sets defaults for a whole subtree.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Icon icon={Home} size="2rem" />
        <Icon icon={Home} size="2rem" title="Home" />
        <IconProvider value={{ size: '2rem', color: 'var(--color-primary)' }}>
          <Home />
          <Home />
        </IconProvider>
      </div>
    </div>
  ),
};

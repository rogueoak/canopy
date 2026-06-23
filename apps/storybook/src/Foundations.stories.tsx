import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '@rogueoak/roots';

/**
 * Foundations/Sample — proves the token seam in Storybook.
 *
 * Renders the throwaway `color-sample` token three ways:
 *  - as a Tailwind utility (`bg-sample`) backed by the Roots @theme preset,
 *  - as the raw CSS variable (`--color-sample`),
 *  - as the typed TS value imported from `@rogueoak/roots`.
 *
 * Placeholder only — real foundations (palette/type/spacing) land in 0003.
 */
function SampleSwatch() {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'sans-serif' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="bg-sample" style={{ width: 48, height: 48, borderRadius: 8 }} />
        <code>Tailwind utility: bg-sample</code>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: 'var(--color-sample)',
          }}
        />
        <code>CSS variable: var(--color-sample)</code>
      </div>
      <div>
        <code>Typed TS export: tokens[&apos;color-sample&apos;] = {tokens['color-sample']}</code>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Sample',
  component: SampleSwatch,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SampleSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sample: Story = {};

import { tokens } from '@rogueoak/roots';

/**
 * Sprout — a throwaway PLACEHOLDER component proving the cross-package + token seam.
 *
 * It imports the `color-sample` value straight from `@rogueoak/roots` (the
 * Style-Dictionary-generated typed export) and renders a labelled swatch.
 * This is NOT a real component — real Seeds arrive in spec 0005.
 */
export interface SproutProps {
  /** Optional label shown beside the swatch. */
  label?: string;
}

const SAMPLE = tokens['color-sample'];

export function Sprout({ label = 'color-sample' }: SproutProps) {
  return (
    <span
      data-testid="sprout"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <span
        aria-hidden="true"
        data-testid="sprout-swatch"
        style={{
          display: 'inline-block',
          width: '1rem',
          height: '1rem',
          borderRadius: '0.25rem',
          backgroundColor: SAMPLE,
        }}
      />
      <code>
        {label}: {SAMPLE}
      </code>
    </span>
  );
}

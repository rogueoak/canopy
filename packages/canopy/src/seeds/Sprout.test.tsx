import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tokens } from '@rogueoak/roots';
import { Sprout } from './Sprout';

describe('Sprout (skeleton smoke test)', () => {
  it('mounts and renders the sample value sourced from @rogueoak/roots', () => {
    render(<Sprout />);
    const el = screen.getByTestId('sprout');
    expect(el).toBeInTheDocument();
    // Proves the cross-package + token seam: the rendered value comes from Roots.
    expect(el).toHaveTextContent(tokens['color-sample']);
  });

  it('applies the Roots token as the swatch background', () => {
    render(<Sprout />);
    const swatch = screen.getByTestId('sprout-swatch');
    expect(swatch).toHaveStyle({ backgroundColor: tokens['color-sample'] });
  });
});

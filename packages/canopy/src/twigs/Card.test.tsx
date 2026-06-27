import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

describe('Card', () => {
  it('renders each slot and its children, composed inside the card', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Project status</CardTitle>
          <CardDescription>Updated a moment ago.</CardDescription>
        </CardHeader>
        <CardContent>Everything is green.</CardContent>
        <CardFooter>
          <button type="button">Refresh</button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByText('Project status')).toBeInTheDocument();
    expect(screen.getByText('Updated a moment ago.')).toBeInTheDocument();
    expect(screen.getByText('Everything is green.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('renders CardTitle as a real heading at the default level (h3)', () => {
    render(<CardTitle>Heading</CardTitle>);
    const heading = screen.getByRole('heading', { name: 'Heading' });
    expect(heading.tagName).toBe('H3');
  });

  it('overrides the heading element via asChild for outline correctness', () => {
    render(
      <CardTitle asChild>
        <h2>Section heading</h2>
      </CardTitle>,
    );
    const heading = screen.getByRole('heading', { name: 'Section heading', level: 2 });
    expect(heading.tagName).toBe('H2');
    // The title role class still rides on the provided element.
    expect(heading).toHaveClass('text-h3');
  });

  it('forwards refs to the underlying elements', () => {
    let cardEl: HTMLDivElement | null = null;
    let titleEl: HTMLHeadingElement | null = null;
    render(
      <Card ref={(el) => (cardEl = el)}>
        <CardTitle ref={(el) => (titleEl = el)}>Titled</CardTitle>
      </Card>,
    );
    expect(cardEl).toBeInstanceOf(HTMLDivElement);
    expect(titleEl).toBeInstanceOf(HTMLHeadingElement);
  });

  it('merges a caller className via cn(), overriding a default', () => {
    render(
      <Card data-testid="card" className="rounded-none">
        <CardContent>Body</CardContent>
      </Card>,
    );
    const card = screen.getByTestId('card');
    // cn() de-dupes the conflicting radius: the caller's `rounded-none` wins over `rounded-lg`.
    expect(card).toHaveClass('rounded-none');
    expect(card).not.toHaveClass('rounded-lg');
    // Non-conflicting base classes are preserved.
    expect(card).toHaveClass('border', 'bg-surface-raised', 'shadow-sm');
  });

  it('spreads native props onto each slot', () => {
    render(
      <CardFooter data-testid="footer" aria-label="actions">
        <span>x</span>
      </CardFooter>,
    );
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveAttribute('aria-label', 'actions');
    expect(footer).toHaveClass('flex', 'items-center');
  });
});

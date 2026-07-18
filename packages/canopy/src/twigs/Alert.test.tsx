import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertDescription, AlertTitle } from './Alert';

describe('Alert', () => {
  it('renders role="alert" by default (an assertive live region)', () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('honors a role="status" override via native props (caller wins over the default)', () => {
    render(
      <Alert role="status">
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );
    // The polite override is present; the assertive default is gone.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('honors an arbitrary role override via native props', () => {
    render(
      <Alert role="note" data-testid="alert">
        <AlertTitle>FYI</AlertTitle>
      </Alert>,
    );
    expect(screen.getByTestId('alert')).toHaveAttribute('role', 'note');
  });

  it.each([
    ['default', ['bg-muted', 'border-border', 'text-text']],
    ['info', ['bg-info', 'text-info-foreground', 'border-transparent']],
    ['success', ['bg-success', 'text-success-foreground', 'border-transparent']],
    ['warning', ['bg-warning', 'text-warning-foreground', 'border-transparent']],
    ['danger', ['bg-danger', 'text-danger-foreground', 'border-transparent']],
  ] as const)(
    'renders the %s variant with its paired surface / border / text tokens',
    (variant, classes) => {
      render(
        <Alert data-testid="alert" variant={variant}>
          <AlertTitle>Notice</AlertTitle>
        </Alert>,
      );
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass(...classes);
      // Every variant shares the base layout.
      expect(alert).toHaveClass('flex', 'gap-3', 'rounded-lg', 'border', 'p-4');
    },
  );

  it('defaults to the "default" variant when none is given', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>Notice</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('bg-muted', 'border-border', 'text-text');
    expect(alert).not.toHaveClass('bg-info', 'bg-danger');
  });

  it('renders the icon slot as decorative (aria-hidden) while the text carries the meaning', () => {
    render(
      <Alert
        icon={
          <svg data-testid="icon" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" />
          </svg>
        }
      >
        <AlertTitle>Update available</AlertTitle>
        <AlertDescription>A new version is ready to install.</AlertDescription>
      </Alert>,
    );
    // The icon renders...
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    // ...wrapped in an aria-hidden container, so assistive tech skips the decoration.
    const wrapper = icon.parentElement as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden');
    // ...while the meaning-bearing text stays exposed to the accessibility tree.
    expect(screen.getByText('Update available')).toBeInTheDocument();
    expect(screen.getByText('A new version is ready to install.')).toBeInTheDocument();
    // The decorative icon carries no accessible text of its own (the meaning is in the copy).
    expect(icon).not.toHaveAccessibleName();
  });

  it('collapses to a text-only layout when no icon is supplied (no icon column rendered)', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>No icon here</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByTestId('alert');
    // The banner has a single child: the text column. There is no leading aria-hidden icon span.
    expect(alert.childElementCount).toBe(1);
    expect(alert.querySelector('[aria-hidden]')).toBeNull();
  });

  it('renders AlertTitle and AlertDescription content with their token classes', () => {
    render(
      <Alert>
        <AlertTitle data-testid="title">Deprecation notice</AlertTitle>
        <AlertDescription data-testid="desc">This endpoint retires in v2.</AlertDescription>
      </Alert>,
    );
    const title = screen.getByTestId('title');
    const desc = screen.getByTestId('desc');
    expect(title).toHaveTextContent('Deprecation notice');
    // The title carries its typography role and font weight; its colour is INHERITED from the
    // container's variant foreground (not pinned to a fixed token), so it reads on every fill.
    expect(title).toHaveClass('text-label', 'font-medium');
    expect(title).not.toHaveClass('text-text');
    expect(desc).toHaveTextContent('This endpoint retires in v2.');
    // The body inherits the container foreground (text-current) and dims via opacity - not a grey
    // token that only pairs with the page surface - so it stays readable on a colour-variant fill.
    expect(desc).toHaveClass('text-body-sm', 'text-current', 'opacity-80');
    expect(desc).not.toHaveClass('text-text-muted');
  });

  it('renders AlertDescription as a paragraph element', () => {
    render(<AlertDescription data-testid="desc">Body</AlertDescription>);
    expect(screen.getByTestId('desc').tagName).toBe('P');
  });

  it('merges a caller className via cn() on Alert, so the caller wins a conflict', () => {
    render(
      <Alert data-testid="alert" className="rounded-none">
        <AlertTitle>Merged</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByTestId('alert');
    // cn() de-dupes the conflicting radius: the caller's `rounded-none` wins over `rounded-lg`.
    expect(alert).toHaveClass('rounded-none');
    expect(alert).not.toHaveClass('rounded-lg');
    // Non-conflicting base classes survive.
    expect(alert).toHaveClass('flex', 'gap-3', 'p-4');
  });

  it('merges a caller className on AlertTitle and AlertDescription (caller wins)', () => {
    render(
      <Alert>
        <AlertTitle data-testid="title" className="text-body">
          T
        </AlertTitle>
        <AlertDescription data-testid="desc" className="text-text">
          D
        </AlertDescription>
      </Alert>,
    );
    const title = screen.getByTestId('title');
    // The caller's role wins over the default `text-label`.
    expect(title).toHaveClass('text-body');
    expect(title).not.toHaveClass('text-label');
    const desc = screen.getByTestId('desc');
    // The caller's colour wins over the default inherited `text-current`.
    expect(desc).toHaveClass('text-text');
    expect(desc).not.toHaveClass('text-current');
  });

  it('spreads native props onto Alert', () => {
    render(
      <Alert data-testid="alert" aria-label="form errors" id="err">
        <AlertTitle>Errors</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('aria-label', 'form errors');
    expect(alert).toHaveAttribute('id', 'err');
  });

  it('forwards refs to all three parts', () => {
    let alertEl: HTMLDivElement | null = null;
    let titleEl: HTMLDivElement | null = null;
    let descEl: HTMLParagraphElement | null = null;
    render(
      <Alert ref={(el) => (alertEl = el)}>
        <AlertTitle ref={(el) => (titleEl = el)}>Titled</AlertTitle>
        <AlertDescription ref={(el) => (descEl = el)}>Body</AlertDescription>
      </Alert>,
    );
    expect(alertEl).toBeInstanceOf(HTMLDivElement);
    expect(titleEl).toBeInstanceOf(HTMLDivElement);
    expect(descEl).toBeInstanceOf(HTMLParagraphElement);
  });
});

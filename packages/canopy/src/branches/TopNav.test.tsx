import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavLink,
  TopNavLinks,
  TopNavMenuButton,
} from './TopNav';

function Basic({
  ariaLabel,
  activeDashboard = false,
}: {
  ariaLabel?: string;
  activeDashboard?: boolean;
}) {
  return (
    <TopNav ariaLabel={ariaLabel}>
      <TopNavBrand>Acme</TopNavBrand>
      <TopNavLinks>
        <TopNavLink href="#dashboard" active={activeDashboard}>
          Dashboard
        </TopNavLink>
        <TopNavLink href="#settings">Settings</TopNavLink>
      </TopNavLinks>
      <TopNavActions>
        <button type="button">Sign in</button>
      </TopNavActions>
      <TopNavMenuButton />
    </TopNav>
  );
}

describe('TopNav', () => {
  it('renders a <nav> landmark with the default aria-label', () => {
    render(<Basic />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Main');
  });

  it('allows the nav aria-label to be overridden', () => {
    render(<Basic ariaLabel="Primary" />);
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Primary');
  });

  it('sets aria-current="page" on the active link and omits it on idle links', () => {
    render(<Basic activeDashboard />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveAttribute('aria-current');
  });

  it('applies active styling to the active link and muted styling to idle links', () => {
    render(<Basic activeDashboard />);
    const active = screen.getByRole('link', { name: 'Dashboard' });
    const idle = screen.getByRole('link', { name: 'Settings' });
    expect(active).toHaveClass('font-medium', 'text-text');
    expect(idle).toHaveClass('text-text-muted');
    expect(idle).not.toHaveClass('font-medium');
  });

  it('the menu button toggles the panel: aria-expanded flips and the panel shows/hides', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;

    // Closed: aria-expanded false and the panel is hidden (`hidden` class, not the `md:flex` row).
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveClass('hidden');

    await user.click(button);
    // Open: aria-expanded true, the label flips, the panel is no longer hidden. (Show/hide is
    // proven by aria-expanded + the `hidden` toggle; cosmetic layout classes aren't asserted.)
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(panel).not.toHaveClass('hidden');

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(panel).toHaveClass('hidden');
  });

  it('wires aria-controls to the TopNavLinks id', () => {
    render(<Basic />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    const controls = button.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    const panel = document.getElementById(controls!);
    expect(panel).not.toBeNull();
    expect(panel).toContainElement(screen.getByRole('link', { name: 'Dashboard' }));
  });

  it('closes on Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.keyboard('{Escape}');
    const reopened = screen.getByRole('button', { name: 'Open menu' });
    expect(reopened).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(reopened);
  });

  it('closes when a pointerdown occurs outside the nav', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Basic />
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Open menu' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // The dismissal effect listens on `pointerdown`; fire that exact event on an outside element.
    await user.pointer({ keys: '[MouseLeft]', target: screen.getByTestId('outside') });
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('does not close when a pointerdown occurs inside the nav', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // A pointerdown INSIDE the nav (the brand) must not dismiss - only outside-pointerdown / Esc do.
    await user.pointer({ keys: '[MouseLeft]', target: screen.getByText('Acme') });
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('closes the panel when a link is clicked', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('asChild on TopNavBrand renders the child element carrying the brand classes', () => {
    render(
      <TopNav>
        <TopNavBrand asChild>
          <a href="/">Acme home</a>
        </TopNavBrand>
      </TopNav>,
    );
    const brand = screen.getByRole('link', { name: 'Acme home' });
    expect(brand.tagName).toBe('A');
    expect(brand).toHaveClass('text-h4');
  });

  it('asChild on TopNavLink renders the child <a> with the link classes (no wrapper)', () => {
    render(
      <TopNav>
        <TopNavLinks>
          <TopNavLink asChild active>
            <a href="/profile">Profile</a>
          </TopNavLink>
        </TopNavLinks>
      </TopNav>,
    );
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('rounded-md', 'font-medium');
  });

  it('merges a caller className over the bar default (cn) on the nav', () => {
    render(
      <TopNav className="bg-muted">
        <TopNavBrand>Acme</TopNavBrand>
      </TopNav>,
    );
    const nav = screen.getByRole('navigation');
    // tailwind-merge de-dupes the conflicting background: the caller's `bg-muted` wins.
    expect(nav).toHaveClass('bg-muted');
    expect(nav).not.toHaveClass('bg-surface');
    // Non-conflicting base classes are preserved.
    expect(nav).toHaveClass('h-14', 'border-b', 'border-border');
  });

  it('forwards a ref to the styled <nav> (the public surface)', () => {
    const ref = createRef<HTMLElement>();
    render(
      <TopNav ref={ref}>
        <TopNavBrand>Acme</TopNavBrand>
      </TopNav>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    // The ref resolves to the element the caller styles (the nav bar), not the wrapper header.
    expect(ref.current).toBe(screen.getByRole('navigation'));
    expect(ref.current).toHaveClass('h-14', 'bg-surface');
  });
});

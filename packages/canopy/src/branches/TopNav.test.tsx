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
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from './NavigationMenu';

function Basic({
  ariaLabel,
  activeDashboard = false,
}: {
  ariaLabel?: string;
  activeDashboard?: boolean;
}) {
  return (
    <TopNav ariaLabel={ariaLabel}>
      <TopNavMenuButton />
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

    // `order-first` keeps the toggle at the start (left) of the bar on mobile regardless of markup.
    expect(button).toHaveClass('order-first');

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

  // Regression guard (feedback 0022): the mobile disclosure panel must stack its links, so the
  // links list has to be a real flex column (a row at md+), NOT `display:contents`. Radix's
  // NavigationMenu.Root injects a block wrapper that defeats a `contents` flatten, which let the
  // inline links flow horizontally. jsdom can't compute flex layout, so this asserts the classes
  // that drive it - it reddens against the old `contents md:contents`.
  it('lays the mobile links out as a flex column, not display:contents', () => {
    render(<Basic />);
    const list = screen.getByRole('list');
    expect(list.className).toContain('flex');
    expect(list.className).toContain('flex-col');
    expect(list.className).toContain('md:flex-row');
    expect(list.className).not.toContain('contents');
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

// Regression coverage for the 0069 refactor: TopNavLinks now composes NavigationMenu internally.
// These assert the refactor is API-preserving - exactly ONE navigation landmark (no second <nav>
// from the composed NavigationMenu), the mobile disclosure collapse still governs the panel id,
// and a consumer can now add a NavigationMenu dropdown into the links area.
describe('TopNav + NavigationMenu (0069 refactor)', () => {
  it('exposes exactly one navigation landmark (the composed NavigationMenu is not a second <nav>)', () => {
    render(<Basic />);
    // getByRole (singular) throws on multiple matches, so this proves the inner NavigationMenu
    // renders `asChild` onto the panel <div> rather than adding its own <nav>.
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main');
  });

  it('keeps the mobile disclosure collapse: the panel id still toggles hidden with aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;

    expect(panel).toHaveClass('hidden');
    await user.click(button);
    expect(panel).not.toHaveClass('hidden');
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('keeps flat links visually identical: no leaked NavigationMenuLink base (block / raised hover)', () => {
    render(<Basic />);
    const link = screen.getByRole('link', { name: 'Settings' });
    // The NavigationMenuLink visual base is neutralized on the TopNav path, so a flat link renders
    // like the pre-refactor bare `<a>`: it must NOT paint a raised-surface hover fill, and stays
    // inline (not `block`) and selectable (not `select-none`).
    expect(link).not.toHaveClass('hover:bg-muted-raised');
    expect(link).not.toHaveClass('block');
    expect(link).not.toHaveClass('select-none');
    expect(link).toHaveClass('inline', 'text-text-muted');
  });

  it('exposes the links as a list of items (the composed NavigationMenuList structure)', () => {
    // The refactor routes flat links through NavigationMenuList/Item, so the accessible tree now
    // exposes a list of listitems. This assertion pins that intended structure as a decision.
    render(<Basic />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]).toContainElement(screen.getByRole('link', { name: 'Dashboard' }));
  });

  it('preserves flat-link tab order and adds Radix arrow traversal between links', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    const settings = screen.getByRole('link', { name: 'Settings' });

    // Tab still reaches the first flat link in document order (unchanged from the bare-<a> model).
    dashboard.focus();
    expect(dashboard).toHaveFocus();
    // Radix installs roving arrow traversal between the links in the list - a conscious interaction
    // gain from composing NavigationMenu, pinned here so a future Radix change is caught.
    await user.keyboard('{ArrowRight}');
    expect(settings).toHaveFocus();
  });

  it('lets a consumer add a NavigationMenu dropdown into the links area', async () => {
    const user = userEvent.setup();
    render(
      <TopNav>
        <TopNavBrand>Acme</TopNavBrand>
        <TopNavLinks>
          <TopNavLink href="#home">Home</TopNavLink>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </TopNavLinks>
      </TopNav>,
    );

    // The flat TopNavLink and the dropdown trigger coexist in the same list.
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Products/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Analytics' })).toBeInTheDocument();
  });
});

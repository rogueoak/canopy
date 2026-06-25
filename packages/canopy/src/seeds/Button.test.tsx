import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children inside a native button', () => {
    render(<Button>Plant a seed</Button>);
    const btn = screen.getByRole('button', { name: 'Plant a seed' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies the default variant + size classes (primary / md)', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    // primary fill + on-role foreground (default variant)
    expect(btn).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary-hover');
    // md size (default)
    expect(btn).toHaveClass('h-10', 'px-4', 'text-sm');
  });

  it('maps a chosen variant + size to the expected token classes', () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-danger', 'text-danger-foreground', 'hover:bg-danger-hover');
    expect(btn).toHaveClass('h-12', 'px-6', 'text-base');
    // must NOT carry the default primary fill
    expect(btn).not.toHaveClass('bg-primary');
  });

  it('includes the focus-visible ring (a11y) and disabled token classes', () => {
    render(<Button>Focus</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
    expect(btn).toHaveClass('disabled:bg-disabled', 'disabled:text-disabled-foreground');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Button className="px-10">Wide</Button>);
    const btn = screen.getByRole('button');
    // tailwind-merge drops the default px-4 in favour of the caller's px-10
    expect(btn).toHaveClass('px-10');
    expect(btn).not.toHaveClass('px-4');
  });

  it('fires onClick when activated by pointer', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('activates via the keyboard (focus + Enter and Space)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Key</Button>);
    const btn = screen.getByRole('button');

    await user.tab();
    expect(btn).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('renders the child element with the button classes when asChild', () => {
    render(
      <Button asChild variant="outline">
        <a href="/seeds">Go</a>
      </Button>,
    );
    // No button is rendered; the anchor takes the button role/classes.
    expect(screen.queryByRole('button')).toBeNull();
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/seeds');
    expect(link).toHaveClass('border-border-strong', 'inline-flex', 'h-10');
  });

  it('forwards a ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

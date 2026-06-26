import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Keyboard } from './Keyboard';

describe('Keyboard', () => {
  it('renders its children inside a semantic <kbd> element', () => {
    render(<Keyboard>Esc</Keyboard>);
    const key = screen.getByText('Esc');
    expect(key.tagName).toBe('KBD');
  });

  it('applies the base key-cap classes + the default size (md)', () => {
    render(<Keyboard>⌘</Keyboard>);
    const key = screen.getByText('⌘');
    // base key-cap look (muted fill, hairline border, mono face)
    expect(key).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded',
      'border',
      'border-border',
      'bg-muted',
      'font-mono',
      'text-muted-foreground',
    );
    // default size box
    expect(key).toHaveClass('h-6', 'min-w-6', 'px-1.5', 'text-xs');
  });

  it.each([
    ['sm', ['h-5', 'min-w-5', 'px-1', 'text-xs']],
    ['md', ['h-6', 'min-w-6', 'px-1.5', 'text-xs']],
  ] as const)('maps the %s size to its box classes', (size, classes) => {
    render(<Keyboard size={size}>{size}</Keyboard>);
    const key = screen.getByText(size);
    expect(key).toHaveClass(...classes);
  });

  it('the sm size does not carry the md box height', () => {
    render(<Keyboard size="sm">Ctrl</Keyboard>);
    const key = screen.getByText('Ctrl');
    expect(key).toHaveClass('h-5');
    expect(key).not.toHaveClass('h-6');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Keyboard className="px-4">K</Keyboard>);
    const key = screen.getByText('K');
    // tailwind-merge drops the default px-1.5 in favour of the caller's px-4
    expect(key).toHaveClass('px-4');
    expect(key).not.toHaveClass('px-1.5');
  });

  it('spreads native props onto the <kbd> element', () => {
    render(
      <Keyboard data-testid="cap" aria-label="Command">
        ⌘
      </Keyboard>,
    );
    const key = screen.getByTestId('cap');
    expect(key).toHaveAttribute('aria-label', 'Command');
  });

  it('forwards a ref to the underlying <kbd>', () => {
    const ref = createRef<HTMLElement>();
    render(<Keyboard ref={ref}>Ref</Keyboard>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('KBD');
  });
});

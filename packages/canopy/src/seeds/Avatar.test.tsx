import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';

// NOTE on the jsdom image-load limitation:
// Radix `AvatarImage` only renders (and the `AvatarFallback` only hides) once the underlying
// `new Image()` fires `onload` — which jsdom never does, since it doesn't actually fetch images.
// So under jsdom the image element is never shown and the fallback is always the visible path.
// That makes the FALLBACK the testable surface here: we assert it renders its initials and that
// the root carries the right size/shape token classes. The image-loaded swap is covered visually
// in Storybook instead (see Avatar.stories.tsx), where real images resolve.

describe('Avatar', () => {
  it('renders the fallback initials when there is no valid image', () => {
    render(
      <Avatar>
        <AvatarImage src="https://invalid.example/nope.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    // The image never resolves under jsdom, so the fallback is what the user sees.
    const fallback = screen.getByText('AL');
    expect(fallback).toBeInTheDocument();
    // The fallback never renders an <img> in this state.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the fallback even with no AvatarImage child at all', () => {
    render(
      <Avatar>
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('applies the fallback surface token classes (centred initials)', () => {
    render(
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText('AL');
    expect(fallback).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'bg-muted',
      'text-muted-foreground',
      'font-medium',
    );
    // The fallback no longer pins a font-size — it inherits the root's size (so initials scale).
    expect(fallback).not.toHaveClass('text-sm');
  });

  it('scales the initials with the avatar size (font-size lives on the root)', () => {
    render(<Avatar data-testid="lg" size="lg" />);
    const root = screen.getByTestId('lg');
    expect(root).toHaveClass('h-12', 'w-12', 'text-base');
  });

  it('applies the circle shape + muted surface on the root by default', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    const root = screen.getByTestId('avatar');
    expect(root).toHaveClass(
      'relative',
      'flex',
      'shrink-0',
      'overflow-hidden',
      'rounded-full',
      'bg-muted',
    );
  });

  it('defaults to the md size (h-10 w-10)', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('avatar')).toHaveClass('h-10', 'w-10');
  });

  it.each([
    ['sm', ['h-8', 'w-8']],
    ['md', ['h-10', 'w-10']],
    ['lg', ['h-12', 'w-12']],
  ] as const)('maps the %s size to its box classes', (size, classes) => {
    render(
      <Avatar data-testid="avatar" size={size}>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('avatar')).toHaveClass(...classes);
  });

  it('merges a caller className over the root defaults (cn / tailwind-merge)', () => {
    render(
      <Avatar data-testid="avatar" className="h-20 w-20">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    const root = screen.getByTestId('avatar');
    // tailwind-merge drops the default md box in favour of the caller's size.
    expect(root).toHaveClass('h-20', 'w-20');
    expect(root).not.toHaveClass('h-10', 'w-10');
  });

  it('forwards a ref to the underlying root element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Avatar ref={ref}>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

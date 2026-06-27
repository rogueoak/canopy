import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders a search input with the default accessible name', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).toHaveAttribute('type', 'search');
  });

  it('overrides the accessible name via aria-label', () => {
    render(<SearchBar aria-label="Find products" />);
    expect(screen.getByRole('searchbox', { name: 'Find products' })).toBeInTheDocument();
  });

  it('shows the clear button only once there is a value', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    await user.type(screen.getByRole('searchbox'), 'apples');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears the value, fires onValueChange(""), and refocuses the input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchBar defaultValue="apples" onValueChange={onValueChange} />);

    const input = screen.getByRole('searchbox');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveFocus();
    // The clear button is gone now that the field is empty.
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('hides the clear button when disabled even with a value', () => {
    render(<SearchBar defaultValue="apples" disabled />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('fires onSearch on Enter with the current value', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'oranges{Enter}');

    expect(onSearch).toHaveBeenCalledWith('oranges');
  });

  it('fires onSearch on form submit with the current value', () => {
    const onSearch = vi.fn();
    render(<SearchBar defaultValue="grapes" onSearch={onSearch} />);

    const input = screen.getByRole('searchbox');
    input.closest('form')!.requestSubmit();

    expect(onSearch).toHaveBeenCalledWith('grapes');
  });

  it('renders the shortcut hint when empty and hides it once there is a value', async () => {
    const user = userEvent.setup();
    render(<SearchBar shortcutHint="K" />);

    expect(screen.getByText('K')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'a');
    expect(screen.queryByText('K')).toBeNull();
  });

  it('supports controlled usage via value + onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchBar value="locked" onValueChange={onValueChange} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('locked');

    // Controlled: typing reports the intended next value but does not mutate the field itself.
    await user.type(input, 'x');
    expect(onValueChange).toHaveBeenCalledWith('lockedx');
    expect(input).toHaveValue('locked');
  });

  it('forwards ref to the underlying input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchBar ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('searchbox'));
  });
});

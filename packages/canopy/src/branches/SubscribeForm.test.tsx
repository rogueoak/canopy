import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SubscribeForm } from './SubscribeForm';

describe('SubscribeForm', () => {
  it('renders the email field and submit button, heading by default', () => {
    render(<SubscribeForm source="test" onSubscribe={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole('heading', { name: 'Subscribe for updates' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('omits the heading when heading={false}', () => {
    render(
      <SubscribeForm
        source="test"
        heading={false}
        onSubscribe={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('keeps the optional Name field out of the a11y tree until the email is focused', async () => {
    const user = userEvent.setup();
    render(<SubscribeForm source="test" onSubscribe={vi.fn().mockResolvedValue(undefined)} />);
    // Collapsed: aria-hidden + tabIndex -1, so it is not an accessible textbox.
    expect(screen.queryByRole('textbox', { name: 'Name (optional)' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('textbox', { name: 'Email address' }));
    expect(screen.getByRole('textbox', { name: 'Name (optional)' })).toBeInTheDocument();
  });

  it('shows the Name field from first paint when alwaysShowName', () => {
    render(
      <SubscribeForm
        source="test"
        alwaysShowName
        onSubscribe={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Name (optional)' })).toBeInTheDocument();
  });

  it('collects { email, name, company } and calls onSubscribe once on submit', async () => {
    const user = userEvent.setup();
    const onSubscribe = vi.fn().mockResolvedValue(undefined);
    render(<SubscribeForm source="blog_index" alwaysShowName onSubscribe={onSubscribe} />);

    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'reader@example.com');
    await user.type(screen.getByRole('textbox', { name: 'Name (optional)' }), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onSubscribe).toHaveBeenCalledWith({
      email: 'reader@example.com',
      name: 'Ada Lovelace',
      company: '',
    });
  });

  it('renders the success card after a resolved submit', async () => {
    const user = userEvent.setup();
    render(
      <SubscribeForm
        source="test"
        successBadge="You are on the list"
        onSubscribe={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    const card = await screen.findByRole('status');
    expect(card).toHaveTextContent('You are on the list');
    // The input row is replaced in place.
    expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
  });

  it('shows the rejected error message in an alert on a failed submit', async () => {
    const user = userEvent.setup();
    const onSubscribe = vi.fn().mockRejectedValue(new Error('Could not reach the server.'));
    render(<SubscribeForm source="test" onSubscribe={onSubscribe} />);

    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach the server.');
    // The form stays interactive so the reader can retry.
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('fires onEvent submitted -> succeeded with PII-free props', async () => {
    const user = userEvent.setup();
    const onEvent = vi.fn();
    render(
      <SubscribeForm
        source="home"
        alwaysShowName
        onEvent={onEvent}
        onSubscribe={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'reader@example.com');
    await user.type(screen.getByRole('textbox', { name: 'Name (optional)' }), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(onEvent).toHaveBeenCalledWith('succeeded', expect.anything()));
    expect(onEvent).toHaveBeenNthCalledWith(1, 'submitted', { source: 'home', has_name: true });
    expect(onEvent).toHaveBeenNthCalledWith(2, 'succeeded', { source: 'home', has_name: true });
    // The name value is never in the analytics payload.
    for (const call of onEvent.mock.calls) {
      expect(JSON.stringify(call[1])).not.toContain('Ada');
    }
  });

  it('fires onEvent failed with the error reason', async () => {
    const user = userEvent.setup();
    const onEvent = vi.fn();
    const err = Object.assign(new Error('Server error.'), { reason: 'http_500' });
    render(
      <SubscribeForm
        source="home"
        onEvent={onEvent}
        onSubscribe={vi.fn().mockRejectedValue(err)}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() =>
      expect(onEvent).toHaveBeenCalledWith('failed', {
        source: 'home',
        has_name: false,
        reason: 'http_500',
      }),
    );
  });

  it('forwards ref to the section element', () => {
    const ref = createRef<HTMLElement>();
    render(
      <SubscribeForm source="test" ref={ref} onSubscribe={vi.fn().mockResolvedValue(undefined)} />,
    );
    expect(ref.current?.tagName).toBe('SECTION');
  });
});

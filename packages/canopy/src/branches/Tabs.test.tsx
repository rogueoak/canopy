import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

/** A reusable 3-tab fixture; `rootProps` spreads onto the root (value, defaultValue, orientation). */
function Fixture(rootProps: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="account" {...rootProps}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="password">Password panel</TabsContent>
      <TabsContent value="team">Team panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders tablist / tab / tabpanel roles', () => {
    render(<Fixture />);
    expect(screen.getByRole('tablist', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    // Only the selected panel is rendered (Radix unmounts inactive panels by default).
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Account panel');
  });

  it('wires aria-selected / aria-controls / aria-orientation', () => {
    render(<Fixture />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    const account = screen.getByRole('tab', { name: 'Account' });
    const password = screen.getByRole('tab', { name: 'Password' });
    expect(account).toHaveAttribute('aria-selected', 'true');
    expect(password).toHaveAttribute('aria-selected', 'false');
    expect(account).toHaveAttribute('aria-controls');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      account.getAttribute('aria-controls'),
    );
  });

  it('clicking a trigger reveals its panel and hides the others', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('tab', { name: 'Password' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Password panel');
    expect(screen.queryByText('Account panel')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('aria-selected', 'true');
  });

  it('uncontrolled defaultValue selects the right tab', () => {
    render(<Fixture defaultValue="team" />);
    expect(screen.getByRole('tab', { name: 'Team' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Team panel');
  });

  it('the active trigger carries data-state=active and the underline class', () => {
    render(<Fixture />);
    const account = screen.getByRole('tab', { name: 'Account' });
    expect(account).toHaveAttribute('data-state', 'active');
    expect(account).toHaveClass('data-[state=active]:border-primary', 'data-[state=active]:text-text');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('data-state', 'inactive');
  });

  it('controlled value / onValueChange reflects and reports selection', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Controlled() {
      const [value, setValue] = useState('account');
      return (
        <div>
          <p>current: {value}</p>
          <Tabs
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
          >
            <TabsList aria-label="Settings">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Account panel</TabsContent>
            <TabsContent value="password">Password panel</TabsContent>
          </Tabs>
        </div>
      );
    }

    render(<Controlled />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Account panel');
    await user.click(screen.getByRole('tab', { name: 'Password' }));
    expect(onValueChange).toHaveBeenCalledWith('password');
    expect(screen.getByText('current: password')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Password panel');
  });

  it('a controlled root does not change selection without onValueChange committing it', async () => {
    const user = userEvent.setup();
    render(
      <Tabs value="account">
        <TabsList aria-label="Settings">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
        <TabsContent value="password">Password panel</TabsContent>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: 'Password' }));
    // No committed value change, so the pinned controlled value wins.
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Account panel');
  });

  it('arrow keys move the active tab horizontally (default automatic activation)', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const account = screen.getByRole('tab', { name: 'Account' });
    account.focus();
    expect(account).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    const password = screen.getByRole('tab', { name: 'Password' });
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Password panel');

    await user.keyboard('{ArrowLeft}');
    expect(account).toHaveFocus();
    expect(account).toHaveAttribute('aria-selected', 'true');
  });

  it('Home / End jump to the first / last tab', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole('tab', { name: 'Account' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Team' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
  });

  it('respects vertical orientation: Up/Down navigate and aria-orientation is vertical', async () => {
    const user = userEvent.setup();
    render(<Fixture orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    const account = screen.getByRole('tab', { name: 'Account' });
    account.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(account).toHaveFocus();
  });

  it('skips a disabled trigger during roving navigation and cannot select it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="account" onValueChange={onValueChange}>
        <TabsList aria-label="Settings">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password" disabled>
            Password
          </TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
        <TabsContent value="password">Password panel</TabsContent>
        <TabsContent value="team">Team panel</TabsContent>
      </Tabs>,
    );
    const password = screen.getByRole('tab', { name: 'Password' });
    expect(password).toBeDisabled();
    expect(password).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');

    // Clicking the disabled tab does not select it.
    await user.click(password);
    expect(password).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Account panel');

    // Roving focus skips the disabled tab: ArrowRight from Account lands on Team.
    screen.getByRole('tab', { name: 'Account' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Team' })).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('team');
  });

  it('merges a caller className over the defaults on each part (caller wins)', () => {
    render(
      <Tabs defaultValue="account" className="gap-8">
        <TabsList aria-label="Settings" className="border-b-0">
          <TabsTrigger value="account" className="px-8">
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="p-6">
          Account panel
        </TabsContent>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('border-b-0');
    expect(list).not.toHaveClass('border-b');
    const trigger = screen.getByRole('tab', { name: 'Account' });
    expect(trigger).toHaveClass('px-8');
    expect(trigger).not.toHaveClass('px-3');
    expect(screen.getByRole('tabpanel')).toHaveClass('p-6');
  });

  it('forwards refs to the root, list, trigger, and content', () => {
    const rootRef = createRef<HTMLDivElement>();
    const listRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="account" ref={rootRef}>
        <TabsList aria-label="Settings" ref={listRef}>
          <TabsTrigger value="account" ref={triggerRef}>
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" ref={contentRef}>
          Account panel
        </TabsContent>
      </Tabs>,
    );
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });
});

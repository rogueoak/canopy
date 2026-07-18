import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, Input, RadioGroup, RadioGroupItem } from '../seeds';
import {
  FieldGroup,
  FieldSet,
  FieldSetDescription,
  FieldSetLegend,
  fieldGroupVariants,
} from './FieldSet';

describe('FieldSet', () => {
  it('renders a native <fieldset> with a <legend> as the accessible group label', () => {
    render(
      <FieldSet>
        <FieldSetLegend>Notifications</FieldSetLegend>
        <Input aria-label="Email" />
      </FieldSet>,
    );

    // The group role comes from the native <fieldset>, and the <legend> names it.
    const group = screen.getByRole('group', { name: 'Notifications' });
    expect(group.tagName).toBe('FIELDSET');
    // The legend is a real <legend> element.
    expect(screen.getByText('Notifications').tagName).toBe('LEGEND');
  });

  it('cascades disabled to a nested control natively (the control is inert)', () => {
    render(
      <FieldSet disabled>
        <FieldSetLegend>Notifications</FieldSetLegend>
        <Input aria-label="Email" />
      </FieldSet>,
    );

    const group = screen.getByRole('group', { name: 'Notifications' });
    expect(group).toBeDisabled();
    // The browser cascade makes the descendant control inert - no per-child wiring.
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('does not set the disabled attribute when enabled', () => {
    render(
      <FieldSet>
        <FieldSetLegend>Notifications</FieldSetLegend>
        <Input aria-label="Email" />
      </FieldSet>,
    );

    expect(screen.getByRole('group', { name: 'Notifications' })).not.toBeDisabled();
    expect(screen.getByLabelText('Email')).not.toBeDisabled();
  });

  it('cascades disabled across a RadioGroup and a Checkbox group', () => {
    render(
      <FieldSet disabled>
        <FieldSetLegend>Plan</FieldSetLegend>
        <RadioGroup defaultValue="free">
          <RadioGroupItem value="free" aria-label="Free" />
          <RadioGroupItem value="pro" aria-label="Pro" />
        </RadioGroup>
        <Checkbox aria-label="Extra" />
      </FieldSet>,
    );

    expect(screen.getByLabelText('Free')).toBeDisabled();
    expect(screen.getByLabelText('Pro')).toBeDisabled();
    expect(screen.getByLabelText('Extra')).toBeDisabled();
  });

  it('associates the description via aria-describedby only when it is rendered', () => {
    const { rerender } = render(
      <FieldSet>
        <FieldSetLegend>Address</FieldSetLegend>
        <Input aria-label="Street" />
      </FieldSet>,
    );

    // No description -> no describedby pointing at an absent node.
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');

    rerender(
      <FieldSet>
        <FieldSetLegend>Address</FieldSetLegend>
        <Input aria-label="Street" />
        <FieldSetDescription>Where you live.</FieldSetDescription>
      </FieldSet>,
    );

    const group = screen.getByRole('group');
    const description = screen.getByText('Where you live.');
    // describedby resolves to a present node.
    expect(group).toHaveAttribute('aria-describedby', description.id);
    expect(document.getElementById(description.id)).toBe(description);
  });

  it('drops aria-describedby when the description unmounts', () => {
    const { rerender } = render(
      <FieldSet>
        <FieldSetLegend>Address</FieldSetLegend>
        <FieldSetDescription>Where you live.</FieldSetDescription>
      </FieldSet>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby');

    rerender(
      <FieldSet>
        <FieldSetLegend>Address</FieldSetLegend>
      </FieldSet>,
    );
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');
  });

  it('dims the legend and description when disabled', () => {
    render(
      <FieldSet disabled>
        <FieldSetLegend>Notifications</FieldSetLegend>
        <FieldSetDescription>Manage how we reach you.</FieldSetDescription>
      </FieldSet>,
    );

    const legend = screen.getByText('Notifications');
    expect(legend).toHaveAttribute('data-disabled');
    expect(legend).toHaveClass('cursor-not-allowed', 'text-text-muted');

    const description = screen.getByText('Manage how we reach you.');
    expect(description).toHaveAttribute('data-disabled');
    expect(description).toHaveClass('text-disabled-foreground');
  });

  it('does not dim the legend or description when enabled', () => {
    render(
      <FieldSet>
        <FieldSetLegend>Notifications</FieldSetLegend>
        <FieldSetDescription>Manage how we reach you.</FieldSetDescription>
      </FieldSet>,
    );

    const legend = screen.getByText('Notifications');
    expect(legend).not.toHaveAttribute('data-disabled');
    expect(legend).toHaveClass('text-text');
    expect(legend).not.toHaveClass('text-text-muted');

    const description = screen.getByText('Manage how we reach you.');
    expect(description).not.toHaveAttribute('data-disabled');
    expect(description).not.toHaveClass('text-disabled-foreground');
  });

  it('renders the required marker on the legend without polluting the group name', () => {
    render(
      <FieldSet>
        <FieldSetLegend required>Plan</FieldSetLegend>
        <Input aria-label="Custom" />
      </FieldSet>,
    );

    // The visual asterisk is present but aria-hidden, so the group name stays clean.
    expect(screen.getByText('*', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAccessibleName('Plan');
  });

  describe('FieldGroup', () => {
    it('defaults to a column stack', () => {
      render(
        <FieldSet>
          <FieldSetLegend>Address</FieldSetLegend>
          <FieldGroup data-testid="grp">
            <Input aria-label="Street" />
          </FieldGroup>
        </FieldSet>,
      );

      const grp = screen.getByTestId('grp');
      expect(grp).toHaveClass('flex', 'flex-col', 'gap-3');
      expect(grp).not.toHaveClass('flex-row');
    });

    it('arranges controls in a row when direction="row"', () => {
      render(
        <FieldSet>
          <FieldSetLegend>Address</FieldSetLegend>
          <FieldGroup direction="row" data-testid="grp">
            <Input aria-label="City" />
            <Input aria-label="Zip" />
          </FieldGroup>
        </FieldSet>,
      );

      const grp = screen.getByTestId('grp');
      expect(grp).toHaveClass('flex', 'flex-row', 'items-center', 'gap-4');
      expect(grp).not.toHaveClass('flex-col');
    });

    it('exposes fieldGroupVariants mapping each direction to literal token classes', () => {
      // The recipe demands full LITERAL token strings (Tailwind v4 scans literals only).
      expect(fieldGroupVariants({ direction: 'column' })).toContain('flex-col');
      expect(fieldGroupVariants({ direction: 'column' })).toContain('gap-3');
      expect(fieldGroupVariants({ direction: 'row' })).toContain('flex-row');
      expect(fieldGroupVariants({ direction: 'row' })).toContain('gap-4');
      // The default variant is column.
      expect(fieldGroupVariants({})).toContain('flex-col');
    });
  });

  describe('className merge (caller wins)', () => {
    it('merges on FieldSet, keeping the last conflicting class', () => {
      render(
        <FieldSet className="p-8" data-testid="fs">
          <FieldSetLegend>Group</FieldSetLegend>
        </FieldSet>,
      );
      const fs = screen.getByTestId('fs');
      // Caller p-8 wins over the recipe p-4; a non-conflicting recipe class survives.
      expect(fs).toHaveClass('p-8', 'rounded-md');
      expect(fs).not.toHaveClass('p-4');
    });

    it('merges on FieldSetLegend', () => {
      render(
        <FieldSet>
          <FieldSetLegend className="text-h1">Group</FieldSetLegend>
        </FieldSet>,
      );
      const legend = screen.getByText('Group');
      expect(legend).toHaveClass('text-h1');
      expect(legend).not.toHaveClass('text-label');
    });

    it('merges on FieldSetDescription', () => {
      render(
        <FieldSet>
          <FieldSetLegend>Group</FieldSetLegend>
          <FieldSetDescription className="text-body">Help</FieldSetDescription>
        </FieldSet>,
      );
      const desc = screen.getByText('Help');
      expect(desc).toHaveClass('text-body', 'text-text-muted');
      expect(desc).not.toHaveClass('text-body-sm');
    });

    it('merges on FieldGroup', () => {
      render(
        <FieldSet>
          <FieldSetLegend>Group</FieldSetLegend>
          <FieldGroup className="gap-8" data-testid="grp" />
        </FieldSet>,
      );
      const grp = screen.getByTestId('grp');
      expect(grp).toHaveClass('gap-8');
      expect(grp).not.toHaveClass('gap-3');
    });
  });

  describe('ref forwarding', () => {
    it('forwards the ref to the <fieldset>', () => {
      const ref = { current: null as HTMLFieldSetElement | null };
      render(
        <FieldSet ref={ref}>
          <FieldSetLegend>Group</FieldSetLegend>
        </FieldSet>,
      );
      expect(ref.current).toBeInstanceOf(HTMLFieldSetElement);
    });

    it('forwards the ref to the <legend>', () => {
      const ref = { current: null as HTMLLegendElement | null };
      render(
        <FieldSet>
          <FieldSetLegend ref={ref}>Group</FieldSetLegend>
        </FieldSet>,
      );
      expect(ref.current).toBeInstanceOf(HTMLLegendElement);
    });

    it('forwards the ref to the description <p>', () => {
      const ref = { current: null as HTMLParagraphElement | null };
      render(
        <FieldSet>
          <FieldSetLegend>Group</FieldSetLegend>
          <FieldSetDescription ref={ref}>Help</FieldSetDescription>
        </FieldSet>,
      );
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('forwards the ref to the FieldGroup <div>', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <FieldSet>
          <FieldSetLegend>Group</FieldSetLegend>
          <FieldGroup ref={ref} />
        </FieldSet>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('context guard', () => {
    it('throws a clear error when the parts are used outside FieldSet', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<FieldSetLegend>Group</FieldSetLegend>)).toThrow(
        '<FieldSetLegend> must be used within a <FieldSet>.',
      );
      expect(() => render(<FieldSetDescription>Help</FieldSetDescription>)).toThrow(
        '<FieldSetDescription> must be used within a <FieldSet>.',
      );
      expect(() => render(<FieldGroup />)).toThrow(
        '<FieldGroup> must be used within a <FieldSet>.',
      );
      spy.mockRestore();
    });
  });
});

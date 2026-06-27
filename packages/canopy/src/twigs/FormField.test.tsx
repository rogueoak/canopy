import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from '../seeds';
import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldLabel,
  FormFieldMessage,
} from './FormField';

describe('FormField', () => {
  it('associates the label with the control (htmlFor === control id, click focuses)', async () => {
    const user = userEvent.setup();
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
      </FormField>,
    );

    // getByLabelText proves the htmlFor -> id wiring resolves to the control.
    const input = screen.getByLabelText('Email');
    expect(input).toBe(screen.getByRole('textbox'));

    await user.click(screen.getByText('Email'));
    expect(input).toHaveFocus();
  });

  it('omits aria-describedby and aria-invalid when there is no description or message', () => {
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('points aria-describedby at the description id when a description is rendered', () => {
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
        <FormFieldDescription>We never share it.</FormFieldDescription>
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    const description = screen.getByText('We never share it.');
    expect(input).toHaveAttribute('aria-describedby', description.id);
    // No message rendered -> the message id is absent and the control is not invalid.
    expect(input.getAttribute('aria-describedby')).not.toContain('message');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('includes both ids (description + message) and omits absent ones', () => {
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
        <FormFieldDescription>We never share it.</FormFieldDescription>
        <FormFieldMessage>Email is required.</FormFieldMessage>
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    const description = screen.getByText('We never share it.');
    const message = screen.getByText('Email is required.');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const ids = describedBy!.split(' ');
    expect(ids).toContain(description.id);
    expect(ids).toContain(message.id);
  });

  it('sets aria-invalid when a non-empty message is rendered', () => {
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
        <FormFieldMessage>Email is required.</FormFieldMessage>
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Email is required.').id);
    // The message announces in the danger role.
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required.');
  });

  it('sets aria-invalid from the explicit invalid prop', () => {
    render(
      <FormField invalid>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
      </FormField>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders nothing for an empty message and keeps describedby clean', () => {
    render(
      <FormField>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
        <FormFieldMessage />
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('renders the required marker on the label', () => {
    render(
      <FormField>
        <FormFieldLabel required>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
      </FormField>,
    );

    // The visual asterisk is present but aria-hidden, so the control's name stays clean.
    expect(screen.getByText('*', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Email');
  });

  it('disables the control and dims the label when disabled', () => {
    render(
      <FormField disabled>
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <Input />
        </FormFieldControl>
      </FormField>,
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('data-disabled');
    expect(label).toHaveClass('text-text-muted');
  });
});

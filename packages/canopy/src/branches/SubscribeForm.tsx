import * as React from 'react';
import { cn } from '../lib/cn';
import { Button, Input } from '../seeds';
import { Card, CardContent, FormField, FormFieldControl, FormFieldLabel } from '../twigs';

/**
 * SubscribeForm - an email-capture Branch (spec 0035): a themed subscribe box with an optional
 * Name field, a submit/success/error state machine, a honeypot, and a success card. It is a
 * Branch because it owns interaction state (the submit state machine + the progressive Name
 * reveal) and composes lower layers (the `Card` / `FormField` Twigs, the `Button` / `Input`
 * Seeds).
 *
 * It is the first **transport-agnostic by injection** Branch: Canopy owns the UI, state, and
 * a11y, but does NO network I/O and knows nothing about any analytics SDK or endpoint. The
 * consumer supplies the submit (`onSubscribe`) and, optionally, analytics (`onEvent`) - so the
 * design-system component stays free of any app coupling (PostHog, Constant Contact, a specific
 * route), the lesson this component banks (see overview/learnings).
 *
 * Semantic tokens only, full-literal class strings, no `dark:` on the common path - light/dark is
 * a property of the token layer. Icon-free: the success check is a hand-rolled inline
 * `currentColor` SVG (the Dialog-close / Breadcrumb-chevron precedent), because Canopy must not
 * depend on `@rogueoak/icons`.
 */

/** The values SubscribeForm collects and hands to `onSubscribe`. `company` is the honeypot. */
export interface SubscribeValues {
  email: string;
  name: string;
  /** Honeypot value - a naive bot fills it; forward it so the server can drop the request. */
  company: string;
}

/** The analytics phase SubscribeForm reports through `onEvent`. */
export type SubscribeEventPhase = 'submitted' | 'succeeded' | 'failed';

/**
 * An error `onSubscribe` may reject with. `message` (any `Error`) is shown to the user; the
 * optional `reason` is forwarded to `onEvent('failed', ...)` for PII-free analytics (e.g.
 * `'http_500'` / `'network'`), so an app keeps the fidelity it had when it owned the fetch.
 */
export interface SubscribeError extends Error {
  reason?: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export interface SubscribeFormProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'onSubmit' | 'title'
> {
  /**
   * Perform the subscription. Receives the collected `{ email, name, company }` (company is the
   * honeypot) and returns a promise: resolve on success, reject to signal failure. Canopy shows
   * the rejected error's `.message` (or a default) and forwards its `.reason` to `onEvent`.
   */
  onSubscribe: (values: SubscribeValues) => Promise<void>;
  /**
   * Which surface this instance renders on - a PII-free analytics dimension passed through to
   * `onEvent`. A plain string so each app uses its own values (e.g. `"blog_index"`, `"home"`).
   */
  source: string;
  /**
   * Optional analytics sink. Called `('submitted', ...)` before the submit, then either
   * `('succeeded', ...)` or `('failed', ...)`. `props` carries `{ source, has_name }` (a boolean,
   * never the name) plus, on failure, a `reason`. Map phases to your own event names + gating.
   */
  onEvent?: (
    phase: SubscribeEventPhase,
    props: { source: string; has_name: boolean; reason?: string },
  ) => void;
  /**
   * Show the optional Name field from first paint instead of revealing it on email focus - used
   * by a dedicated page that leads with the full ask.
   */
  alwaysShowName?: boolean;
  /** Render the box's own heading (`title` + `description`). A page with its own copy sets false. */
  heading?: boolean;
  /** Heading text, shown when `heading` is true. */
  title?: React.ReactNode;
  /** Sub-heading text, shown when `heading` is true. */
  description?: React.ReactNode;
  /** The submit button's label (and its submitting label via `submittingLabel`). */
  submitLabel?: React.ReactNode;
  /** The submit button's label while the request is in flight. */
  submittingLabel?: React.ReactNode;
  /** The success card's badge label (beside the check glyph). */
  successBadge?: React.ReactNode;
  /** The success card's body copy, under the badge. */
  successMessage?: React.ReactNode;
}

export const SubscribeForm = React.forwardRef<HTMLElement, SubscribeFormProps>(
  (
    {
      className,
      onSubscribe,
      source,
      onEvent,
      alwaysShowName = false,
      heading = true,
      title = 'Subscribe for updates',
      description = 'New posts in your inbox now and then. No spam; unsubscribe anytime.',
      submitLabel = 'Subscribe',
      submittingLabel = 'Subscribing...',
      successBadge = 'You are on the list',
      successMessage = 'Check your inbox for a welcome message. If you do not see it, look in your junk or spam folder, move it to your inbox, and mark it as not spam. Thank you!',
      ...props
    },
    ref,
  ) => {
    const [status, setStatus] = React.useState<Status>({ kind: 'idle' });
    // Progressive disclosure: the optional Name field stays hidden until the reader focuses the
    // email, then stays revealed (never hidden again, so it does not vanish out from under a
    // click). `alwaysShowName` starts it revealed so all fields show up front.
    const [expanded, setExpanded] = React.useState(alwaysShowName);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const email = String(data.get('email') ?? '');
      const name = String(data.get('name') ?? '');
      const company = String(data.get('company') ?? '');
      // `has_name` is PII-free (a boolean, never the name itself) so a consumer can see how often
      // the optional field is used without capturing what was typed.
      const hasName = name.trim() !== '';

      setStatus({ kind: 'submitting' });
      onEvent?.('submitted', { source, has_name: hasName });
      try {
        await onSubscribe({ email, name, company });
        form.reset();
        setStatus({ kind: 'success' });
        onEvent?.('succeeded', { source, has_name: hasName });
      } catch (error) {
        const err = error as SubscribeError | undefined;
        setStatus({
          kind: 'error',
          message:
            typeof err?.message === 'string' && err.message
              ? err.message
              : 'Something went wrong. Please try again.',
        });
        onEvent?.('failed', {
          source,
          has_name: hasName,
          reason: typeof err?.reason === 'string' ? err.reason : 'error',
        });
      }
    }

    const submitting = status.kind === 'submitting';

    return (
      <section ref={ref} className={className} {...props}>
        {heading ? (
          <>
            <h2 className="text-h3 font-bold text-text">{title}</h2>
            <p className="mt-2 max-w-2xl text-body text-text-muted">{description}</p>
          </>
        ) : null}

        <form onSubmit={handleSubmit} className={heading ? 'mt-5' : undefined} noValidate>
          {/* On a successful subscribe the fields + button are replaced in place by a card: a
              confirmation badge sits at the top and the welcome / deliverability note beneath it,
              so the text reads as anchored, not floating. Otherwise the input row renders: it
              stays inline at sm+ whether or not the optional Name field is revealed (email
              shortens; the revealed Name sits between it and the button); below sm the fields
              stack. */}
          {status.kind === 'success' ? (
            <Card role="status">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-body font-medium text-success">
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M13.5 4.5 6 12l-3.5-3.5" />
                  </svg>
                  {successBadge}
                </span>
                <p className="text-body text-text-muted">{successMessage}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FormField className="w-full sm:flex-[2]">
                <FormFieldLabel className="sr-only">Email address</FormFieldLabel>
                <FormFieldControl>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    maxLength={200}
                    onFocus={() => setExpanded(true)}
                  />
                </FormFieldControl>
              </FormField>

              {/* Optional Name. Always in the DOM (so its label ships in the SSR HTML). Instead of
                  display:none (which cannot animate), it collapses via size + opacity and ANIMATES
                  open on reveal: on sm+ it grows horizontally (max-w 0 -> md, the button slides
                  over); below sm it grows vertically (max-h 0 -> 24, the button is pushed down).
                  Fast + eased; `motion-reduce:transition-none` makes it instant for reduced-motion
                  users. `sm:max-w-md` is only an animation cap - wider than the field's real flex
                  width in every container, so it never clips. While collapsed the input is out of
                  the tab order + a11y tree, restored on reveal. */}
              <FormField
                className={cn(
                  'w-full overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none sm:flex-1',
                  expanded
                    ? 'max-h-24 opacity-100 sm:max-h-none sm:max-w-md'
                    : 'pointer-events-none max-h-0 opacity-0 sm:max-h-none sm:max-w-0',
                )}
              >
                <FormFieldLabel className="sr-only">Name (optional)</FormFieldLabel>
                <FormFieldControl>
                  <Input
                    name="name"
                    type="text"
                    placeholder="Name (optional)"
                    autoComplete="name"
                    maxLength={100}
                    aria-hidden={expanded ? undefined : true}
                    tabIndex={expanded ? undefined : -1}
                  />
                </FormFieldControl>
              </FormField>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          )}

          {/* Honeypot: hidden from users and assistive tech; a naive bot that fills every input
              trips it and (via the value forwarded in onSubscribe) the server drops the request. */}
          <div className="hidden" aria-hidden>
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {status.kind === 'error' && (
            <p role="alert" className="mt-3 text-body text-danger">
              {status.message}
            </p>
          )}
        </form>
      </section>
    );
  },
);
SubscribeForm.displayName = 'SubscribeForm';

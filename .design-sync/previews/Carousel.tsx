import * as React from 'react';
import * as S from "@ds-stories/apps/storybook/src/Carousel.stories";

function compose(S: any, key: string) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}) };
  // Storybook resolves argTypes.mapping (control value -> real arg) before
  // rendering; mirror that so mapped args don't render raw.
  const at: any = { ...(meta.argTypes ?? {}), ...(st && st.argTypes ? st.argTypes : {}) };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === 'object' && args[k] in m) args[k] = m[args[k]];
  }
  const title: string = typeof meta.title === 'string' ? meta.title : '';
  const ctx: any = {
    args, name: key, title, kind: title, id: '', componentId: '',
    globals: {}, viewMode: 'story',
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === 'function') render = () => st.render(args, ctx);
  else if (typeof st === 'function') render = () => st(args, ctx);
  else if (typeof meta.render === 'function') render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  // [].concat: a single function is legal CSF decorator shorthand. A
  // decorator returning undefined (stubbed addon) falls through to the inner
  // render — otherwise one unrecognized addon blanks the cell silently.
  const decorators: any[] = ([] as any[]).concat((st && st.decorators) ?? []).concat(meta.decorators ?? []);
  return decorators.reduce((inner: any, dec: any) => () => {
    const out = dec(inner, ctx);
    return out === undefined ? inner() : out;
  }, render);
}

// The Carousel stories declare `parameters: { layout: 'centered' }`, which
// storybook honors by shrink-wrapping + centering the story in the canvas.
// Previews bundle decorators only (not parameters), so they render left-aligned
// — and the paging controls (CarouselPrevious/CarouselNext) sit ABSOLUTELY
// positioned OUTSIDE the content-sized carousel box, so the left arrow lands at
// negative x and gets clipped off the page edge. Wrap each story in a centering
// flex container (as Menubar did) so the carousel centers and both arrows have
// room, matching the storybook render.
function centered(inner: any) {
  return () =>
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
          width: '100%',
          boxSizing: 'border-box',
          padding: '3.5rem',
        },
      },
      React.createElement(inner),
    );
}

export const Playground = centered(compose(S, "Playground"));
export const Horizontal = centered(compose(S, "Horizontal"));
export const Vertical = centered(compose(S, "Vertical"));
export const MultipleItems = centered(compose(S, "MultipleItems"));
export const WithContent = centered(compose(S, "WithContent"));
export const Loop = centered(compose(S, "Loop"));
export const DisabledAtEnds = centered(compose(S, "DisabledAtEnds"));
export const Dots = centered(compose(S, "Dots"));

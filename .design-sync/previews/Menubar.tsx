import * as React from 'react';
import * as S from "@ds-stories/apps/storybook/src/Menubar.stories";

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

// The Menubar stories set `parameters.layout: 'centered'`, so storybook
// shrink-wraps and horizontally centers the bar. The Menubar root is a
// full-width flex (`flex h-10 ...`), so without that centering the preview
// renders a full-bleed bar while storybook shows a compact centered one. Wrap
// each story in a centering flex container to mirror the storybook layout so
// the component (the bar itself) reads identically on both sides.
function centered(Inner: () => any) {
  return () =>
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'center' } },
      React.createElement(Inner as any),
    );
}

export const Playground = /* Playground */ centered(compose(S, "Playground"));
export const CheckboxItems = /* Checkbox Items */ centered(compose(S, "CheckboxItems"));
export const RadioGroup = /* Radio Group */ centered(compose(S, "RadioGroup"));
export const SubMenu = /* Sub Menu */ centered(compose(S, "SubMenu"));
export const DisabledItems = /* Disabled Items */ centered(compose(S, "DisabledItems"));
export const WithShortcuts = /* With Shortcuts */ centered(compose(S, "WithShortcuts"));

import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { createElement } from 'react';
import './tailwind.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // Paint the canvas with the semantic surface so EVERY story renders on the themed
    // background (`bg-bg`) and text colour (`text-text`). Without this, a dark story shows
    // dark-token components on Storybook's default WHITE canvas - e.g. the near-white
    // `text-text` of outline/ghost Buttons becomes invisible. It reads the runtime vars, so
    // it flips with the `.dark` toggle below at zero per-story cost (Foundations stories paint
    // their own background; this makes that automatic for every component story).
    (Story) =>
      createElement(
        'div',
        { className: 'bg-bg text-text', style: { minHeight: '100vh', padding: '2rem' } },
        createElement(Story),
      ),
    // Light/dark toolbar toggle (spec 0004). Functional: toggles the `.dark` class on the
    // preview `<html>` (`parentSelector` defaults to `html`). Because `tokens.css` `.dark`
    // overrides the semantic runtime vars, every utility (`bg-primary`, …) and every
    // `var(--color-*)` read re-resolves under `.dark` - the whole UI re-themes with zero
    // per-story code. Light is the default.
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
};

export default preview;

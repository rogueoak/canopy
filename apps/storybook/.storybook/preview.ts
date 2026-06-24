import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
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
    // Light/dark toolbar toggle (spec 0004). Functional: toggles the `.dark` class on the
    // preview `<html>` (`parentSelector` defaults to `html`). Because `tokens.css` `.dark`
    // overrides the semantic runtime vars, every utility (`bg-primary`, …) and every
    // `var(--color-*)` read re-resolves under `.dark` — the whole UI re-themes with zero
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

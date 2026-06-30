import type { IconType } from 'react-icons';
import * as icons from './icons';

/**
 * The curated set as a name -> component map, derived from `./icons` (its single source of
 * truth). Use it to render an icon dynamically or to build a catalog - the Storybook catalog and
 * the exported-names test both read this, so the rendered docs can never drift from the exports.
 *
 * Importing `iconRegistry` references every icon (that is the point - it *is* the whole set), so
 * reach for the individual named exports when you want tree-shaking.
 */
export const iconRegistry: Record<string, IconType> = { ...icons };

/** Every curated icon's export name, sorted - the catalog's and tests' list of record. */
export const iconNames: string[] = Object.keys(iconRegistry).sort();

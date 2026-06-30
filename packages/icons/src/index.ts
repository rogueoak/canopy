/**
 * `@rogueoak/icons` - the curated Canopy icon set.
 *
 * - Individual, tree-shakeable icon components (`Home`, `Search`, `Github`, ...) from `./icons`.
 * - `Icon` / `IconProvider` size + accessibility wrappers from `./Icon`.
 * - `iconRegistry` / `iconNames` (the whole set as data) from `./registry` - for catalogs and
 *   dynamic rendering.
 */
export * from './icons';
export { Icon, IconProvider } from './Icon';
export type { IconProps, IconProviderProps, IconBaseProps, IconType } from './Icon';
export { iconRegistry, iconNames } from './registry';

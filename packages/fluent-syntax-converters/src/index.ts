import { FluentAdapter } from './fluentAdapter';
import { LocalizableStringsAdapter } from './localizableStringsAdapter';
import { Typesafei18nAdapter } from './typesafei18nAdapter';

export * from './types/adapterInterface';
export * from './types/serializedResource';
export * from './utils/parseResources';
export * from './utils/serializeResources';

/**
 * Object holding all available adapters.
 *
 * Using this object instead of directly importing adapters ensures one
 * crucial thing: the naming (key) of adapters is consistent throughout
 * inlang e.g. "typesafe-i18n" is not "typesafeAdapter", or "TypesafeI18n".
 *
 * @example
 *      adapters.fluent
 *      >> FluentAdapter
 *
 * @example
 *      Object.keys(adapters)
 *      >> list all available adapters
 */
// performance implications:
// + no garbage collection. Each adapter is initialized only once.
// - no code splitting. A piece of software might only need one specific adapter.
export const adapters = {
    'localizable-strings': new LocalizableStringsAdapter(),
    fluent: new FluentAdapter(),
    'typesafe-i18n': new Typesafei18nAdapter(),
} as const;

/**
 * Supported adapters.
 *
 * Uses the keys of the `adapter` object.
 */
export type SupportedAdapter = keyof typeof adapters;

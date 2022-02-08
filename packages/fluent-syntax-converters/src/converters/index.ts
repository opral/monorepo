import { FluentConverter } from './fluent/converter';
import { LocalizableStringsConverter } from './localizable-strings/converter';
import { Typesafei18nConverter } from './typesafe-i18n/converter';

/**
 * Object holding all available converters.
 *
 * Using this object instead of directly importing converters ensures one
 * crucial thing: the naming (key) of converters is consistent throughout
 * inlang e.g. "typesafe-i18n" is not "typesafeAdapter", or "TypesafeI18n".
 *
 * @example
 *      converters.fluent
 *      >> FluentAdapter
 *
 * @example
 *      Object.keys(converters)
 *      >> list all available converters
 */
// performance implications:
// + no garbage collection. Each adapter is initialized only once.
// - no code splitting. A piece of software might only need one specific adapter.
export const converters = {
    'localizable-strings': new LocalizableStringsConverter(),
    fluent: new FluentConverter(),
    'typesafe-i18n': new Typesafei18nConverter(),
} as const;

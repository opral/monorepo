import { FluentConverter } from './fluent/converter';
import { LocalizableStringsConverter } from './localizable-strings/converter';

/**
 * Object holding all available converters.
 *
 * Using this object instead of directly importing converters ensures one
 * crucial thing: the naming (key) of converters is consistent throughout
 * inlang e.g. "typesafe-i18n" is not "typesafeConverter", or "TypesafeI18n".
 *
 * @example
 *      converters.fluent
 *      >> FluentConverter
 *
 * @example
 *      Object.keys(converters)
 *      >> list all available converters
 */
// performance implications:
// + no garbage collection. Each converter is initialized only once.
// - no code splitting. A piece of software might only need one specific converter.
export const converters = {
    'localizable-strings': new LocalizableStringsConverter(),
    fluent: new FluentConverter(),
} as const;

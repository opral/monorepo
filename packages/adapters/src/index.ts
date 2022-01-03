import { FluentAdapter } from './fluentAdapter';
import { SwiftAdapter } from './swiftAdapter';
import { Typesafei18nAdapter, Typesafei18nAdapterOptions } from './typesafei18nAdapter';
import { Result } from '@inlang/common';
import { SingleResource } from '@inlang/fluent-syntax';

/**
 * Each adapter must implement the interface.
 *
 * The underlying implementation can vastly differ per adapter.
 * For example, some adapters make us of PEG parsing, while others
 * "simply" parse and serialize with regular JavaScript/Typescript.
 */
export interface AdapterInterface {
    parse(data: string): Result<SingleResource, Error>;

    serialize(data: SingleResource, options?: Typesafei18nAdapterOptions): Result<string, Error>;
}

/**
 * Object holding all available adapters.
 *
 * Using this object instead of directly importing adapters ensures one
 * crucial thing: the naming (key) of adapters is consistent throughout
 * inlang e.g. "typesafe-i18n" is not "typesafeAdapter", or "TypesafeI18n".
 */
// performance implications:
// + no garbage collection. Each adapter is initialized only once.
// - no code splitting. A piece of software might only need one specific adapter.
export const adapters = {
    swift: new SwiftAdapter(),
    fluent: new FluentAdapter(),
    'typesafe-i18n': new Typesafei18nAdapter(),
};

/**
 * Supported adapters.
 *
 * Uses the keys of the `adapter` object.
 */
export type SupportedAdapter = keyof typeof adapters;

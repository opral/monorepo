import { Result } from '@inlang/common';
import { SingleResource } from '@inlang/fluent-syntax';
import { Typesafei18nConverterOptions } from '../converters/typesafe-i18n/converter';

/**
 * Each adapter must implement the interface.
 *
 * The underlying implementation can vastly differ per adapter.
 * For example, some adapters make us of PEG parsing, while others
 * "simply" parse and serialize with regular JavaScript/Typescript.
 */
export type Converter = {
    parse(args: { data: string }): Result<SingleResource, Error>;
    serialize(args: { resource: SingleResource }, options?: Typesafei18nConverterOptions): Result<string, Error>;
};

import { Typesafei18nAdapterOptions } from '../typesafei18nAdapter';
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

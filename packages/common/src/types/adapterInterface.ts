import * as fluent from '@fluent/syntax';
import { Typesafei18nAdapterOptions } from '../adapters/typesafei18nAdapter';
import { Result } from './result';

export interface AdapterInterface {
    parse(data: string): Result<fluent.Resource, Error>;

    serialize(data: fluent.Resource, options?: Typesafei18nAdapterOptions): Result<string, Error>;
}

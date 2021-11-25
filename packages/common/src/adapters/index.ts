import { FluentAdapter } from './fluentAdapter';
import { SwiftAdapter } from './swiftAdapter';
import { Typesafei18nAdapter } from './typesafei18nAdapter';
import * as fluent from '@fluent/syntax';
import { Typesafei18nAdapterOptions } from '../adapters/typesafei18nAdapter';
import { Result } from '../types/result';

export interface AdapterInterface {
    parse(data: string): Result<fluent.Resource, Error>;

    serialize(data: fluent.Resource, options?: Typesafei18nAdapterOptions): Result<string, Error>;
}

export const adapters = {
    swift: SwiftAdapter,
    fluent: FluentAdapter,
    'typesafe-i18n': Typesafei18nAdapter,
};

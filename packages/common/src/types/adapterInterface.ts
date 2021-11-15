import * as fluent from '@fluent/syntax';
import { LanguageCode } from './languageCode';
import { Result } from './result';

export interface AdapterInterface {
    parse(data: string): Result<fluent.Resource, unknown>;

    serialize(data: fluent.Resource, options: { onlyForLanguage?: LanguageCode }): Result<string, unknown>;
}

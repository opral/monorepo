import { LanguageCode } from './languageCode';

/**
 * A serialized resource (a file saved in the source code/database).
 *
 * The data attribute can be used to parse this file to a `fluent.Resource`.
 */
export type SerializedResource = {
    data: string;
    languageCode: LanguageCode;
};

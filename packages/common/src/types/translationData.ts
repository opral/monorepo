import { LanguageCode } from './languageCode';

export type TranslationData<T> = {
    languageCode: LanguageCode;
    data: T;
};

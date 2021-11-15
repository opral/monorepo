import { Message, Resource, Term, Entry, Identifier, Pattern, Attribute } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';
import { TranslationData } from '../types/translationData';
import { remove } from 'lodash';

export class TranslationAPI {
    adapter: AdapterInterface;
    resources: TranslationData<Resource>[];
    baseLocale: LanguageCode;

    constructor(args: { adapter: AdapterInterface; locales: TranslationData<string>[]; baseLocale: LanguageCode }) {
        this.adapter = args.adapter;
        this.resources = args.locales.map((locale) => ({
            languageCode: locale.languageCode,
            data: this.adapter.parse(locale.data).data ?? this.#throwExpression('Parsing failed'),
        }));
        this.baseLocale = args.baseLocale;
    }

    #throwExpression(errorMessage: string): never {
        throw new Error(errorMessage);
    }

    getTranslation(key: string, language: string): string | null {
        const translation = this.resources
            .find((resource) => resource.languageCode === language)
            ?.data.body.find((entry) => entry.type === ('Message' || 'Term') && entry.id.name === key);
        if (translation === undefined) {
            return null;
        }

        return this.adapter.serialize(new Resource([translation]), {}).data;
    }

    createKey(key: string, base: string): boolean {
        return (
            (this.resources
                .find((resource) => resource.languageCode === this.baseLocale)
                ?.data?.body?.push(
                    this.adapter.parse(`${key} = ${base}`).data?.body[0] ?? this.#throwExpression('Parsing failed')
                ) ?? this.#throwExpression('Finding base locale failed')) > 0
        );
    }

    deleteKey(key: string): boolean {
        return this.resources.some((resource) =>
            remove(
                resource.data.body,
                (resource) => resource.type !== ('Message' || 'Term') || resource.id.name === key
            )
        );
    }

    updateKey(key: string, translation: string, language: LanguageCode): Error[] | null {
        const translations = this.resources.find((resource) => resource.languageCode === language)?.data.body;
        if (translations === undefined) {
            return [new Error('Language not found')];
        }

        const indexOfTranslation = translations?.findIndex(
            (entry: Entry) => entry.type === ('Message' || 'Term') && entry.id.name === key
        );

        if (indexOfTranslation === undefined) {
            return [new Error('Key not found')];
        }
        const parsedTranslation = this.adapter.parse(`${key} = ${translation}`).data?.body[0];
        if (parsedTranslation === undefined) {
            return [new Error('Incorrect translation')];
        }
        translations[indexOfTranslation] = parsedTranslation;
        return null;
    }
}

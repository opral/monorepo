import * as fluent from '@fluent/syntax';
import { Resource, Entry } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';
import { TranslationFile } from '../types/translationFile';
import { remove } from 'lodash';

export class TranslationAPI {
    adapter: AdapterInterface;
    resources: { data: Resource; languageCode: LanguageCode }[];
    baseLanguage: LanguageCode;

    constructor(args: { adapter: AdapterInterface; files: TranslationFile[]; baseLanguage: LanguageCode }) {
        this.adapter = args.adapter;
        this.resources = args.files.map((file) => ({
            languageCode: file.languageCode,
            data: this.adapter.parse(file.data).data ?? this.#throwExpression('Parsing failed'),
        }));
        this.baseLanguage = args.baseLanguage;
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
                .find((resource) => resource.languageCode === this.baseLanguage)
                ?.data?.body?.push(
                    fluent.parse(`${key} = ${base}`, {}).body[0] ?? this.#throwExpression('Parsing failed')
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
        const parsedTranslation =
            fluent.parse(`${key} = ${translation}`, {}).body[0] ?? this.#throwExpression('Parsing failed');
        if (parsedTranslation === undefined) {
            return [new Error('Incorrect translation')];
        }
        translations[indexOfTranslation] = parsedTranslation;
        return null;
    }

    // This probably runs really poorly... Too bad!
    checkMissingTranslations(): { key: string; languageCodes: LanguageCode[] }[] | null {
        return (
            this.resources
                .find((baseResource) => baseResource.languageCode === this.baseLanguage)
                ?.data.body.filter((entry) => entry.type === 'Message' || entry.type === 'Term')
                .map((baseEntry) => ({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    key: baseEntry.id.name as string,
                    languageCodes: this.resources
                        .map((resource) => {
                            return resource.data.body.some(
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                (entry) => entry.id.name === baseEntry.id.name
                            ) === false
                                ? resource.languageCode
                                : null;
                        })
                        .filter((n) => n),
                })) as { key: string; languageCodes: LanguageCode[] }[]
        )?.filter((n) => n.languageCodes.length > 0);
    }
}

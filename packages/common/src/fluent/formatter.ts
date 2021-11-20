import * as fluent from '@fluent/syntax';
import { Resource, Entry } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';
import { TranslationFile } from '../types/translationFile';
import { remove } from 'lodash';
import { Result } from '../types/result';

export class TranslationAPI {
    adapter: AdapterInterface;
    resources: { data: Resource; languageCode: LanguageCode }[];
    baseLanguage: LanguageCode;

    private constructor(args: {
        adapter: AdapterInterface;
        baseLanguage: LanguageCode;
        resources: { data: Resource; languageCode: LanguageCode }[];
    }) {
        this.adapter = args.adapter;
        this.resources = args.resources;
        this.baseLanguage = args.baseLanguage;
    }

    static initialize(args: {
        adapter: AdapterInterface;
        files: TranslationFile[];
        baseLanguage: LanguageCode;
    }): Result<TranslationAPI, 'Parsing error'> {
        const resources: { data: Resource; languageCode: LanguageCode }[] = [];
        for (const file of args.files) {
            const parse = args.adapter.parse(file.data);
            if (parse.error || parse.data === null) {
                return {
                    data: null,
                    error: 'Parsing error',
                };
            }
            resources.push({ languageCode: file.languageCode, data: parse.data });
        }
        return {
            data: new TranslationAPI({ adapter: args.adapter, resources, baseLanguage: args.baseLanguage }),
            error: null,
        };
    }

    #throwExpression(errorMessage: string): never {
        throw new Error(errorMessage);
    }

    doesKeyExist(key: string): boolean {
        for (const resource of this.resources) {
            if (this.getTranslation(key, resource.languageCode) === null) {
                return true;
            }
        }
        return false;
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

    getAllTranslations(key: string): { languageCode: LanguageCode; translation: string | null }[] | null {
        const output = [];
        if (this.doesKeyExist(key) === false) {
            return null;
        }
        for (const resource of this.resources) {
            output.push({
                languageCode: resource.languageCode,
                translation: this.getTranslation(key, resource.languageCode),
            });
        }
        return output;
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

    getAllKeys(): string[] {
        const keys = [];
        for (const resource of this.resources) {
            for (const entry of resource.data.body) {
                if (entry.type === 'Message' || entry.type === 'Term') {
                    keys.push(entry.id.name);
                }
            }
        }
        return keys;
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

    updateFile(files: TranslationFile[], options = { override: false }): string | null {
        for (const file of files) {
            const parse = this.adapter.parse(file.data);
            if (parse.error || parse.data === null) {
                return 'Parsing error';
            }
            for (const resource of this.resources) {
                if (resource.languageCode === file.languageCode) {
                    if (resource.data.body.length > parse.data.body.length || options.override === true) {
                        resource.data = parse.data;
                    } else {
                        return 'Less keys than original, please set options.override: true to override';
                    }
                }
            }
        }
        return null;
    }

    getFluentFiles(): { data: string; languageCode: LanguageCode }[] | unknown {
        const files = [];
        for (const resource of this.resources) {
            const serial = this.adapter.serialize(resource.data, {});
            if (serial.data === null) {
                return serial.error;
            }
            files.push({ data: serial.data, languageCode: resource.languageCode });
        }
        return files;
    }
}

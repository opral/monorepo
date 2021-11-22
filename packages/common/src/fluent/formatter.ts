import * as fluent from '@fluent/syntax';
import { Resource, Entry, Message, Identifier, Pattern, serializeExpression } from '@fluent/syntax';
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
    }): Result<TranslationAPI, Error> {
        const resources: { data: Resource; languageCode: LanguageCode }[] = [];
        for (const file of args.files) {
            const parse = args.adapter.parse(file.data);
            if (parse.isErr) {
                return Result.err(parse.error);
            }
            resources.push({ languageCode: file.languageCode, data: parse.value });
        }
        return Result.ok(new TranslationAPI({ adapter: args.adapter, resources, baseLanguage: args.baseLanguage }));
    }

    doesKeyExist(key: string): boolean {
        for (const resource of this.resources) {
            if (resource.languageCode === this.baseLanguage) {
                for (const entry of resource.data.body) {
                    if (entry.type === 'Message') {
                        if (entry.id.name === key) return true;
                    }
                }
            }
        }
        return false;
    }

    getTranslation(key: string, language: string): Result<string, Error> {
        let translation;
        for (const resource of this.resources) {
            if (resource.languageCode === language) {
                for (const entry of resource.data.body) {
                    if (entry.type === 'Message' && entry.id.name === key) {
                        translation = entry;
                    }
                }
            }
        }

        if (translation === undefined) {
            return Result.err(Error('Key not found'));
        }
        if (translation.value === null) return Result.ok('');
        let out = '';
        for (const element of translation.value.elements) {
            if (element.type === 'Placeable') {
                out += serializeExpression(element.expression);
            } else {
                out += element.value;
            }
        }
        return Result.ok(out);
    }

    getAllTranslations(
        key: string
    ): Result<{ key: string; languageCode: LanguageCode; translation: string | undefined }[], Error> {
        const output = [];
        if (this.doesKeyExist(key) === false) {
            return Result.err(Error('Key does not exist'));
        }
        for (const resource of this.resources) {
            const translation = this.getTranslation(key, resource.languageCode);
            if (translation.isOk) {
                output.push({
                    key: key,
                    languageCode: resource.languageCode,
                    translation: translation.value,
                });
            }
        }
        return Result.ok(output);
    }

    createKey(key: string, base: string): Result<void, Error> {
        if (this.doesKeyExist(key)) {
            return Result.err(Error('Key already exists'));
        }
        for (const resource of this.resources) {
            if (resource.languageCode === this.baseLanguage) {
                const parse = fluent.parse(`${key} = ${base}`, {}).body[0];
                resource.data.body.push(parse);
                return Result.ok(undefined);
            }
        }
        return Result.err(Error('Base language not found'));
    }

    deleteKey(key: string): Result<void, Error> {
        let removedElements = 0;
        for (const resource of this.resources) {
            removedElements += remove(
                resource.data.body,
                (resource) => (resource.type === 'Message' || resource.type === 'Term') && resource.id.name === key
            ).length;
        }
        if (removedElements === 0) {
            return Result.err(Error('Key not found'));
        } else {
            return Result.ok(undefined);
        }
    }

    getAllKeys(): Result<string[], Error> {
        const keys = [];
        for (const resource of this.resources) {
            if (resource.languageCode === this.baseLanguage) {
                for (const entry of resource.data.body) {
                    if (entry.type === 'Message') {
                        keys.push(entry.id.name);
                    }
                }
            }
        }
        return Result.ok(keys);
    }

    updateKey(key: string, translation: string | undefined, language: LanguageCode): Result<void, Error> {
        const translations = this.resources.find((resource) => resource.languageCode === language)?.data.body;
        if (translations === undefined) {
            return Result.err(Error('Language not found'));
        }

        const indexOfTranslation = translations?.findIndex(
            (entry: Entry) => entry.type === ('Message' || 'Term') && entry.id.name === key
        );

        if (indexOfTranslation === -1) {
            return Result.err(Error('Key not found'));
        }
        const parsedTranslation = fluent.parse(`${key} = ${translation ?? '""'}`, {}).body[0];
        translations[indexOfTranslation] = parsedTranslation;
        return Result.ok(undefined);
    }

    // This probably runs really poorly... Too bad!
    checkMissingTranslations(): Result<{ key: string; languageCodes: LanguageCode[] }[], Error> {
        const result = [];
        for (const baseResource of this.resources) {
            if (baseResource.languageCode === this.baseLanguage) {
                for (const baseEntry of baseResource.data.body) {
                    if (baseEntry.type === 'Message') {
                        const missingLanguages: LanguageCode[] = [];
                        for (const resource of this.resources) {
                            let isTranslatedInLanguage = false;
                            for (const entry of resource.data.body) {
                                if (entry.type === 'Message') {
                                    if (entry.id.name === baseEntry.id.name) {
                                        isTranslatedInLanguage = true;
                                        break;
                                    }
                                }
                            }
                            if (isTranslatedInLanguage === false) {
                                missingLanguages.push(resource.languageCode);
                            }
                        }
                        if (missingLanguages.length > 0) {
                            result.push({ key: baseEntry.id.name, languageCodes: missingLanguages });
                        }
                    }
                }
            }
        }
        return Result.ok(result);
    }

    checkMissingTranslationsForKey(key: string): Result<{ key: string; languageCode: LanguageCode }[], Error> {
        const out = [];
        const missingTranslations = this.checkMissingTranslations();
        if (missingTranslations.isErr) return Result.err(missingTranslations.error);
        for (const missingKey of missingTranslations.value) {
            if (missingKey.key === key) {
                for (const language of missingKey.languageCodes) {
                    out.push({ key: key, languageCode: language });
                }
                return Result.ok(out);
            }
        }
        return Result.ok([]);
    }

    updateFile(files: TranslationFile[], options = { override: false }): Result<void, Error> {
        for (const file of files) {
            const parse = this.adapter.parse(file.data);
            if (parse.isErr) {
                return Result.err(Error('Parsing error'));
            }
            for (const resource of this.resources) {
                if (resource.languageCode === file.languageCode) {
                    if (resource.data.body.length > parse.value.body.length && options.override === false) {
                        return Result.err(
                            Error('Less keys than original, please set options.override: true to override')
                        );
                    } else {
                        resource.data = parse.value;
                    }
                }
            }
        }
        return Result.ok(undefined);
    }

    getFluentFiles(): Result<{ data: string; languageCode: LanguageCode }[], Error> {
        const files = [];
        for (const resource of this.resources) {
            const serial = this.adapter.serialize(resource.data);
            if (serial.isErr) {
                return Result.err(serial.error);
            }
            files.push({ data: serial.value, languageCode: resource.languageCode });
        }
        return Result.ok(files);
    }

    doesTranslationExist(key: string, languageCode: LanguageCode): boolean {
        for (const resource of this.resources) {
            if (resource.languageCode === languageCode) {
                for (const entry of resource.data.body) {
                    if (entry.type === 'Message') {
                        if (entry.id.name === key) return true;
                    }
                }
                break;
            }
        }
        return false;
    }

    createTranslation(key: string, translation: string | undefined, languageCode: LanguageCode): Result<void, Error> {
        if (this.doesTranslationExist(key, languageCode)) {
            return Result.err(Error('Translation already exists'));
        }
        for (const resource of this.resources) {
            if (resource.languageCode === languageCode) {
                const parse = fluent.parse(`${key} = ${translation ?? '""'}`, {}).body[0];
                resource.data.body.push(parse);
                return Result.ok(undefined);
            }
        }
        return Result.err(Error('Language not found'));
    }
}

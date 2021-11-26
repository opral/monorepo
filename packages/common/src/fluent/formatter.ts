import * as fluent from '@fluent/syntax';
import { Resource, Entry, Message, Identifier, Pattern, serializeExpression } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';
import { TranslationFile } from '../types/translationFile';
import { remove } from 'lodash';
import { Result } from '../types/result';

export class TranslationAPI {
    resources: { data: Resource; languageCode: LanguageCode }[];
    baseLanguage: LanguageCode;

    private constructor(args: {
        baseLanguage: LanguageCode;
        resources: { data: Resource; languageCode: LanguageCode }[];
    }) {
        this.resources = args.resources;
        this.baseLanguage = args.baseLanguage;
    }

    static parse(args: {
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
            for (const entry of parse.value.body) {
                if (entry.type === 'Junk') {
                    return Result.err(Error('Parsing error: Junk'));
                }
            }
            resources.push({ languageCode: file.languageCode, data: parse.value });
        }
        return Result.ok(new TranslationAPI({ resources, baseLanguage: args.baseLanguage }));
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
                out += '{' + serializeExpression(element.expression) + '}';
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
                if (parse.type === 'Junk') return Result.err(Error('Parsing error: Junk'));
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
            (entry) => entry.type === 'Message' && entry.id.name === key
        );

        if (indexOfTranslation === -1) {
            return Result.err(Error('Key not found'));
        }
        const parsedTranslation = fluent.parse(`${key} = ${translation ?? '""'}`, {}).body[0];
        if (parsedTranslation.type === 'Junk') return Result.err(Error('Parsing error: Junk'));
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

    /*updateFile(files: TranslationFile[], options = { override: false }): Result<void, Error> {
        for (const file of files) {
            const parse = this.adapter.parse(file.data);
            if (parse.isErr) {
                return Result.err(Error('Parsing error'));
            }
            for (const entry of parse.value.body) {
                if (entry.type === 'Junk') {
                    return Result.err(Error('Parsing error: Junk'));
                }
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
    }*/

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
                if (parse.type === 'Junk') return Result.err(Error('Parsing error: Junk'));
                resource.data.body.push(parse);
                return Result.ok(undefined);
            }
        }
        return Result.err(Error('Language not found'));
    }

    // This could probably be optimized a lot
    checkMissingVariables(): Result<
        { key: string; missingFromBaseTranslation: boolean; variable: string; languageCode: LanguageCode }[],
        Error
    > {
        const result = [];
        for (const baseResource of this.resources) {
            if (baseResource.languageCode === this.baseLanguage) {
                for (const baseEntry of baseResource.data.body) {
                    if (baseEntry.type === 'Message') {
                        const basePlaceables = [];
                        if (baseEntry.value === null) return Result.err(Error('Base entry value null'));
                        for (const baseElement of baseEntry.value?.elements) {
                            if (baseElement.type === 'Placeable') {
                                basePlaceables.push(serializeExpression(baseElement.expression));
                            }
                        }
                        for (const resource of this.resources) {
                            if (baseResource.languageCode === resource.languageCode) continue;
                            for (const entry of resource.data.body) {
                                if (entry.type === 'Message') {
                                    if (entry.id.name === baseEntry.id.name) {
                                        const placeables = [];
                                        if (entry.value === null) return Result.err(Error('Entry value null'));
                                        for (const element of entry.value?.elements) {
                                            if (element.type === 'Placeable') {
                                                placeables.push(serializeExpression(element.expression));
                                            }
                                        }
                                        for (const basePlaceable of basePlaceables) {
                                            let match = false;
                                            for (const placeable of placeables) {
                                                if (placeable === basePlaceable) {
                                                    match = true;
                                                    break;
                                                }
                                            }
                                            if (match === false) {
                                                result.push({
                                                    key: entry.id.name,
                                                    missingFromBaseTranslation: false,
                                                    variable: basePlaceable,
                                                    languageCode: resource.languageCode,
                                                });
                                            }
                                        }
                                        for (const placeable of placeables) {
                                            let match = false;
                                            for (const basePlaceable of basePlaceables) {
                                                if (placeable === basePlaceable) {
                                                    match = true;
                                                    break;
                                                }
                                            }
                                            if (match === false) {
                                                result.push({
                                                    key: entry.id.name,
                                                    missingFromBaseTranslation: true,
                                                    variable: placeable,
                                                    languageCode: resource.languageCode,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return Result.ok(result);
    }

    compareVariables(
        translations: { key: string; languageCode: LanguageCode; translation?: string }[],
        baseTranslation?: { key: string; languageCode: LanguageCode; translation?: string }
    ): Result<{ [language: string]: { error: string; variable: string } }, Error> {
        const errors: { [language: string]: { error: string; variable: string } } = {};
        const baseParse = fluent.parse(`key = ${baseTranslation?.translation}`, {}).body[0];
        if (baseParse.type !== 'Message') {
            return Result.ok({
                [baseTranslation?.languageCode as string]: { error: 'Base translation is incorrect', variable: '' },
            });
        }

        const expressionArray: fluent.Expression[] = [];
        for (const element of baseParse.value?.elements ?? []) {
            if (element.type === 'Placeable') {
                expressionArray.push(element.expression);
            }
        }

        for (const translation of translations) {
            const parse = fluent.parse(`key = ${translation.translation ?? ''}`, {}).body[0];
            if (parse.type !== 'Message') {
                errors[translation.languageCode] = {
                    error: 'Translation is incorrect',
                    variable: '',
                };
                return Result.ok(errors);
            }

            const translationExpressionArray: fluent.Expression[] = [];
            for (const element of parse.value?.elements ?? []) {
                if (element.type === 'Placeable') {
                    translationExpressionArray.push(element.expression);
                    if (
                        expressionArray.some(
                            (expression) => serializeExpression(expression) === serializeExpression(element.expression)
                        ) === false
                    ) {
                        errors[translation.languageCode] = {
                            error: ' is missing from base translation',
                            variable: serializeExpression(element.expression),
                        };
                    }
                }
            }
            for (const expression of expressionArray) {
                if (
                    translationExpressionArray.some(
                        (exp) => serializeExpression(exp) === serializeExpression(expression)
                    ) === false
                ) {
                    errors[translation.languageCode] = {
                        error: ' is missing',
                        variable: serializeExpression(expression),
                    };
                }
            }
        }
        return Result.ok(errors);
    }

    verifyKeyName(key: string): boolean {
        const parse = fluent.parse(`${key} = Hopefully not junk`, {});
        return parse.body[0].type === 'Message';
    }

    serialize(adapter: AdapterInterface): Result<{ data: string; languageCode: LanguageCode }[], Error> {
        const files = [];
        for (const resource of this.resources) {
            const serial = adapter.serialize(resource.data);
            if (serial.isErr) {
                return Result.err(serial.error);
            }
            files.push({ data: serial.value, languageCode: resource.languageCode });
        }
        return Result.ok(files);
    }
}

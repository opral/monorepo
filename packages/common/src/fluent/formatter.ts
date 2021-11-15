import { Message, Resource, Term, Entry, Identifier, Pattern, Attribute } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';
import { TranslationData } from '../types/translationData';

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

    #isMessageOrTerm(entry: Entry): entry is Entry {
        return 'value' in entry;
    }

    #getMessageOrTerm(resource: TranslationData<Resource>): (Message | Term)[] | undefined {
        return resource.data.body.filter(this.#isMessageOrTerm) as (Message | Term)[];
    }

    getTranslation(key: string, language: string): string | null {
        return this.adapter.serialize(
            new Resource(
                this.#getMessageOrTerm(
                    this.resources.find((resource) => resource.languageCode === language) ??
                        this.#throwExpression('Language not found')
                )?.filter((messageOrTerm) => messageOrTerm.id.name === key) ??
                    this.#throwExpression('Getting translation failed')
            ),
            {}
        ).data;
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
}

import { Message, Resource, Term, Entry, Identifier, Pattern, Attribute } from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { LanguageCode } from '../types/languageCode';

export class TranslationAPI {
    adapter: AdapterInterface;
    resources: Array<{ language: LanguageCode; resource: Resource }>;
    baseLocale: LanguageCode;

    constructor(args: {
        adapter: AdapterInterface;
        locales: Array<{ language: LanguageCode; data: string }>;
        baseLocale: LanguageCode;
    }) {
        this.adapter = args.adapter;
        this.resources = args.locales.map((locale) => ({
            language: locale.language,
            resource: this.adapter.parse(locale.data).data ?? this.#throwExpression('Parsing failed'),
        }));
        this.baseLocale = args.baseLocale;
    }

    #throwExpression(errorMessage: string): never {
        throw new Error(errorMessage);
    }

    #isMessageOrTerm(entry: Entry): entry is Entry {
        return 'value' in entry;
    }

    #getMessageOrTerm(language: string): (Message | Term)[] | undefined {
        return this.resources
            .find((resource) => resource.language === language)
            ?.resource.body.filter(this.#isMessageOrTerm) as (Message | Term)[];
    }

    getTranslation(key: string, language: string): string | null {
        return this.adapter.serialize(
            new Resource(
                this.#getMessageOrTerm(language)?.filter((messageOrTerm) => messageOrTerm.id.name === key) ??
                    this.#throwExpression('Getting translation failed')
            ),
            {}
        ).data;
    }
}

import {
    InlangError,
    TranslationsDoNotExistError,
    UnknownError,
} from './errors'
import { InlangTextApi } from './inlangTextApi'
import type { Locale, TranslationsForLocale } from './types'

/**
 * Initialize a new Inlang object with `Inlang.loadTranslations(...args)`
 */
export class Inlang {
    /**
     * The domain of the project.
     */
    #projectDomain: string

    /**
     * The locale of the with which the object has been created.
     */
    #locale: Locale

    /**
     * The record contains all translations for a given locale.
     *
     * If something went wrong during the loading of the translations,
     * the variable will not be null.
     */
    #translations: TranslationsForLocale | null
    #translationsError: InlangError | null

    /**
     * The text api to use.
     */
    #textApi: typeof InlangTextApi

    /**
     * Contains the missingTranslations that have been tracked already
     * in this session i.e. no need to make a new POST request.
     *
     * Is a record to avoid traversing an array. The boolean value
     * is just a placeholder if a key has been tracked.
     */
    #trackedMissingTranslations: Record<string, boolean | undefined> = {}

    /**
     * Is supposed to be private but visible for testing.
     * @visibleForTesting
     */
    constructor(args: {
        projectDomain: string
        locale: Locale
        translations: TranslationsForLocale | null
        translationsError: InlangError | null
        textApi?: typeof InlangTextApi
    }) {
        this.#locale = args.locale
        this.#translations = args.translations
        this.#projectDomain = args.projectDomain
        this.#translationsError = args.translationsError
        this.#textApi = args.textApi ?? InlangTextApi
    }

    /**
     * @summary
     * Initializes a new Inlang object containing the translations for the
     * given locale.
     *
     * @param projectDomain The domain of the project.
     * @param locale The locale of the translations to be loaded.
     * @param textApi The text api to be used. If undefined `InlangTextApi` is used.
     * @returns Inlang instance.
     */
    public static async loadTranslations(args: {
        projectDomain: string
        locale: Locale
        textApi?: typeof InlangTextApi
    }): Promise<Inlang> {
        let translations: TranslationsForLocale | null = null
        let error: InlangError | null = null
        try {
            const response = await fetch(
                `https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${args.projectDomain}/${args.locale}.json`
            )
            if (response.ok) {
                translations = await response.json()
            } else if (response.status === 400) {
                error = new TranslationsDoNotExistError({
                    locale: args.locale,
                })
            } else {
                error = new UnknownError(await response.text())
            }
        } catch (e) {
            error = new UnknownError((e as Error).message)
        } finally {
            if (error) {
                console.error(error)
            }
            return new Inlang({
                projectDomain: args.projectDomain,
                locale: args.locale,
                translations: translations,
                translationsError: error,
            })
        }
    }

    public static fromJson(json: string): Inlang {
        return new Inlang({ ...JSON.parse(json) })
    }

    public toJson(): string {
        return JSON.stringify(this)
    }

    async #postMissingTranslation(trimmedText: string): Promise<void> {
        try {
            if (this.#trackedMissingTranslations[trimmedText] !== undefined) {
                // has been reported already, thus return
                return
            }
            const response = await fetch(
                'https://app.inlang.dev/api/missingTranslation',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        projectDomain: this.#projectDomain,
                        key: trimmedText,
                        locale: this.#locale,
                    }),
                }
            )
            if (response.status === 404) {
                console.error(
                    `Inlang ERROR: The project ${
                        this.#projectDomain
                    } does not exist.`
                )
            }
            this.#trackedMissingTranslations[trimmedText] = true
        } catch {
            // pass
        }
    }

    translate(text: string): InlangTextApi {
        // trimmed corrects formatting which can be corrupted due to template literal string
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
        if (this.#translations === null && this.#translationsError) {
            console.warn(this.#translationsError)
        }
        // if the translation is undefined and the developmentLocale does not equal
        // the translation local -> post missing translation
        else if (
            this.#translations?.byKey[trimmed] === undefined &&
            this.#locale !==
                this.#translations?.metadata.projectDevelopmentLocale
        ) {
            // the key does not exist, thus post as missing translation
            this.#postMissingTranslation(trimmed)
        }
        // in any case return the TextApi which will fallback to the input
        // but the user will see text.
        return new this.#textApi(trimmed, {
            translation: this.#translations?.byKey[trimmed],
            locale: this.#locale,
        })
    }
}

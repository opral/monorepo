import {
    InlangError,
    TranslationsDoNotExistError,
    UnknownError,
} from './errors'
import { InlangTextApi } from './inlangTextApi'
import type { Locale, Translations } from './types'

/**
 * Initialize a new Inlang object with `Inlang.loadTranslations(...args)`
 */
export class Inlang {
    /**
     * The domain of the project.
     */
    private projectDomain: string

    /**
     * The locale of the current translations.
     */
    private locale: string

    /**
     * The development locale of the project.
     *
     * Is null if `loadTranslations` has an error.
     */
    private projectDevelopmentLocale: string | null

    /**
     * The record contains all translations for a given locale.
     *
     * If something went wrong during the loading of the translations,
     * the variable will not be null.
     */
    private translations: Translations | null
    private translationsError: InlangError | null

    /**
     * The text api to use.
     */
    private textApi: typeof InlangTextApi

    /**
     * Contains the missingTranslations that have been tracked already
     * in this session i.e. no need to make a new POST request.
     *
     * Is a record to avoid traversing an array. The boolean value
     * is just a placeholder if a key has been tracked.
     */
    private trackedMissingTranslations: Record<string, boolean | undefined> = {}

    /**
     * @visibleForTesting
     */
    constructor(args: {
        projectDomain: string
        projectDevelopmentLocale: string | null
        locale: string
        translations: Translations | null
        translationsError: InlangError | null
        textApi?: typeof InlangTextApi
    }) {
        this.projectDevelopmentLocale = args.projectDevelopmentLocale
        this.locale = args.locale
        this.translations = args.translations
        this.projectDomain = args.projectDomain
        this.translationsError = args.translationsError
        this.textApi = args.textApi ?? InlangTextApi
    }

    /**
     * Initializes a new Inlang object conatining the translations for the
     * given locale.
     */
    public static async loadTranslations(args: {
        projectDomain: string
        locale: Locale
    }): Promise<Inlang> {
        let translations: Translations | null = null
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
                projectDevelopmentLocale:
                    translations?.['_inlangProjectDevelopmentLocale'] ?? null,
                locale: args.locale,
                translations: translations,
                translationsError: error,
            })
        }
    }

    private async postMissingTranslation(trimmedText: string): Promise<void> {
        try {
            if (this.trackedMissingTranslations[trimmedText] !== undefined) {
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
                        projectDomain: this.projectDomain,
                        key: trimmedText,
                        locale: this.locale,
                    }),
                }
            )
            if (response.status === 404) {
                console.error(
                    `Inlang ERROR: The project ${this.projectDomain} does not exist.`
                )
            }
            this.trackedMissingTranslations[trimmedText] = true
        } catch {
            // pass
        }
    }

    translate(text: string): InlangTextApi {
        // trimmed corrects formatting which can be corrupted due to template literal
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
        // the translation exists
        if (this.translations?.[trimmed]) {
            return new this.textApi(trimmed, {
                translation: this.translations[trimmed],
            })
        }
        // if the locale is identical to the projectDevelopmentLocale
        // then return the textApi without translations.
        else if (this.locale === this.projectDevelopmentLocale) {
            return new this.textApi(trimmed, { translation: undefined })
        }
        // Either an error happened during `loadTranslations` or
        // the translation simply does not exist yet.
        if (this.translations === null && this.translationsError) {
            console.warn(this.translationsError)
        } else if (this.trackedMissingTranslations[trimmed] === undefined) {
            // the key does not exist, thus post as missing translation
            this.postMissingTranslation(trimmed)
        }
        // in any case return the TextApi which will fallback to the input
        // but the user will see text.
        return new this.textApi(trimmed, { translation: undefined })
    }
}

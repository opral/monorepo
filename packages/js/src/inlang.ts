import {
    InlangError,
    TranslationsDoNotExistError,
    UnknownError,
} from './errors'
import { InlangTextApi } from './inlangTextApi'
import type { InlangProjectConfig, Locale } from './types'

/**
 * Initialize a new Inlang object with `Inlang.loadTranslations(...args)`
 */
export class Inlang {
    #config: InlangProjectConfig

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
    #translations: Record<string, string | undefined>

    /**
     * The text api to use.
     */
    // in the future: devs can extend this class and have customized
    // text apis? 
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
        config: InlangProjectConfig
        locale: Locale
        translations: Record<string, string | undefined>
        textApi?: typeof InlangTextApi
    }) {
        this.#config = args.config
        this.#locale = args.locale
        this.#translations = args.translations
        this.#textApi = args.textApi ?? InlangTextApi
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
                        projectDomain: this.#config.projectId,
                        key: trimmedText,
                        locale: this.#locale,
                    }),
                }
            )
            if (response.status === 404) {
                console.error(
                    `Inlang ERROR: The project ${
                        this.#config.projectId
                    } does not exist.`
                )
            }
            this.#trackedMissingTranslations[trimmedText] = true
        } catch {
            // pass
        }
    }

    textApi(text: string): InlangTextApi {
        // trimmed corrects formatting which can be corrupted due to template literal string
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
        // if the translation is undefined and the developmentLocale does not equal
        // the translation local -> post missing translation
        if (
            this.#translations[trimmed] === undefined &&
            this.#locale !== this.#translations.projectDevelopmentLocale
        ) {
            // the key does not exist, thus post as missing translation
            this.#postMissingTranslation(trimmed)
        }
        // in any case return the TextApi which will fallback to the input
        // but the user will see text.
        return new this.#textApi(trimmed, {
            translation: this.#translations[trimmed],
            locale: this.#locale,
        })
    }
}

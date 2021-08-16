import { MissingVariableError } from './errors'
import { interpolate, requiresInterpolation } from './interpolate'
import type { PluralRules, Translations } from './types'

/**
 * The locale of the current translations.
 *
 * `loadTranslation()` sets the locale.
 */
let SPECIFIED_LOCALE: string

/**
 * The record contains all translations for a given locale.
 *
 * Can be undefined if you forgot to set the translations via
 * `setTranslations()`.
 */
let TRANSLATIONS: Translations | undefined

/**
 * The domain of the project.
 */
let INLANG_PROJECT_DOMAIN: string

/**
 * Contains the missingTranslations that have been tracked already
 * in this session i.e. no need to make a new POST request.
 *
 * The format follows either the key exists indicated by not `undefined`.
 * The boolean value is just a placeholder.
 */
let TRACKED_MISSING_TRANSLATIONS: Record<string, boolean | undefined>

async function postMissingTranslation(trimmedText: string): Promise<void> {
    try {
        if (TRACKED_MISSING_TRANSLATIONS[trimmedText] !== undefined) {
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
                    projectDomain: INLANG_PROJECT_DOMAIN,
                    key: trimmedText,
                    locale: SPECIFIED_LOCALE,
                }),
            }
        )
        if (response.status === 404) {
            console.error(
                `Inlang ERROR: The project ${INLANG_PROJECT_DOMAIN} does not exist.`
            )
        }
        TRACKED_MISSING_TRANSLATIONS[trimmedText] = true
    } catch {
        // pass
    }
}

/**
 * Loads the translations for a given locale.
 *
 * You must set the translations after loading the translations afterwards
 * like so:
 * ```JS
 *  const translations = await loadTranslations(...args);
 *  setTranslations(translations);
 * ```
 *
 * The load and set API is especially useful for SSR and static site generation
 * since the translations can be fetched beforehand and passed to the site.
 *
 *
 */
export async function loadTranslations(
    projectDomain: string,
    locale: string
): Promise<Translations> {
    INLANG_PROJECT_DOMAIN = projectDomain
    SPECIFIED_LOCALE = locale
    TRACKED_MISSING_TRANSLATIONS = {}
    try {
        const response = await fetch(
            `https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${INLANG_PROJECT_DOMAIN}/${SPECIFIED_LOCALE}.json`
        )
        if (response.ok) {
            return await response.json()
        } else if (response.status === 400) {
            return {
                _inlangWarning: `Inlang WARNING: Translations for the specified locale ${SPECIFIED_LOCALE} does not exist (yet).
                    If the warning is unexpected, have you published your changes?`,
            }
        } else {
            return {
                _inlangError: await response.text(),
            }
        }
    } catch (e) {
        return {
            _inlangError: e,
        }
    }
}

/**
 * Sets the translations internally which are used by the `t()` function.
 *
 * @param translations The translations as returned by `await loadTranslations(...args)`
 */
export function setTranslations(translations: Translations): void {
    TRANSLATIONS = translations
    if (TRANSLATIONS['_inlangError']) {
        console.error(
            `Inlang ERROR: getting translations: ${TRANSLATIONS['_inlangError']}`
        )
    } else if (TRANSLATIONS['_inlangWarning']) {
        console.warn(TRANSLATIONS['_inlangWarning'])
    }
}

/**
 * Translates given text based on the loaded translations.
 *
 * If the text does not exist in the translations, or any error occurs, the provided
 * (untranslated) text is returned as fallback.
 *
 * Sometimes the latter is intentional. Your development language e.g. German,
 * Spanish etc. does not need to be translated and for those locales no translations
 * exist.
 *
 */
export function t(
    text: string,
    args: {
        vars?: Record<string, string | number>
        plural?: PluralRules
    } = {}
): string {
    if (TRANSLATIONS === undefined) {
        console.error(`Inlang ERROR: The translations are undefined. Did you forget to set the translations
        via setTranslations()?`)
        return text
    }
    // an error occured while fetching the translations which has been logged to
    // console in setTranslations
    else if (TRANSLATIONS['_inlangError']) {
        return text
    }
    // no translations have been fetched since the locale is the development locale
    else if (
        TRANSLATIONS['_inlangProjectDevelopmentLocale'] === SPECIFIED_LOCALE
    ) {
        return text
    }
    try {
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
        if (TRANSLATIONS[trimmed] === undefined) {
            // the key does not exist, thus post as missing translation
            postMissingTranslation(trimmed)
            return text
        }
        let result = TRANSLATIONS[trimmed] as string
        if (requiresInterpolation(result)) {
            if (args.vars === undefined) {
                throw new MissingVariableError(result)
            }
            result = interpolate(result, args.vars)
        }
        return result
    } catch (e) {
        // rethrow development errors
        if (e instanceof MissingVariableError) {
            throw e
        }
        // if something goes wrong return the fallback text
        return text
    }
}

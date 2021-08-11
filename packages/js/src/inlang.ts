import type { Translations } from './types'

/**
 * The development locale -> "language of the app without translations".
 */
let DEVELOPMENT_LOCALE: string

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
let trackedMissingTranslations: Record<string, boolean | undefined>

async function postMissingTranslation(trimmedText: string): Promise<void> {
    try {
        if (trackedMissingTranslations[trimmedText] !== undefined) {
            // has been reported already, thus return
            return
        }
        await fetch('https://app.inlang.dev/api/missingTranslation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectDomain: INLANG_PROJECT_DOMAIN,
                key: trimmedText,
                locale: SPECIFIED_LOCALE,
            }),
        })
        trackedMissingTranslations[trimmedText] = true
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
 * @param projectDomain The domain you specified when creating your inlang project.
 * @param developmentLocale The locale in which the app is developed. All your text is
 * english? Then your development locale is "en".
 * @param locale The locale of the translations to be loaded. Your user is from Germany?
 * Then the locale is "de". If the `developmentLocale` and `locale` are identical, pass
 * both e.g. `loadTranslations("example.com", "en", "en")
 *
 */
export async function loadTranslations(
    projectDomain: string,
    developmentLocale: string,
    locale: string
): Promise<Translations> {
    INLANG_PROJECT_DOMAIN = projectDomain
    DEVELOPMENT_LOCALE = developmentLocale
    SPECIFIED_LOCALE = locale
    trackedMissingTranslations = {}
    // if the global locale is defined -> load the translation for that locale
    if (SPECIFIED_LOCALE !== DEVELOPMENT_LOCALE) {
        try {
            const response = await fetch(
                `https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${INLANG_PROJECT_DOMAIN}/${SPECIFIED_LOCALE}.json`
            )
            if (response.ok) {
                return await response.json()
            }
        } catch (e) {
            console.log(e)
        }
    }
    // return empty translations as the specified locale is
    // identical to the development locale -> no translations
    // need to be fetched.
    return {}
}

/**
 * Sets the translations internally which are used by the `t()` function.
 *
 * @param translations The translations as returned by `await loadTranslations(...args)`
 */
export function setTranslations(translations: Translations): void {
    TRANSLATIONS = translations
}

/**
 * Translates given text based on the loaded translations.
 *
 * If the text does not exist in the translations, or any error occurs, the provided
 * (untranslated) text is returned as fallback.
 *
 *  In case the fallback was unintentional, did you forget to set the translations via
 * `setTranslations()` ?
 *
 * Sometimes the latter is intentional. Your development language e.g. German,
 * Spanish etc. does not need to be translated and for those locales no translations
 * exist.
 *
 */
export function t(text: string): string {
    if (SPECIFIED_LOCALE === DEVELOPMENT_LOCALE) {
        return text
    }
    if (TRANSLATIONS === undefined) {
        throw Error(`
            The translations are undefined. Did you forget to set the translations
            via setTranslations()?
        `)
    }
    try {
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
        if (TRANSLATIONS[trimmed]) {
            return TRANSLATIONS[trimmed] as string
        }
        // the key does not exist, thus post as missing translation
        postMissingTranslation(trimmed)
        return text
    } catch {
        // in any case return the fallback text
        return text
    }
}

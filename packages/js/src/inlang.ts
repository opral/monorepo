/**
 * The record contains all translations for a given locale.
 */
let inlangTranslations: Record<string, string>

/**
 * The locale of the translations to be loaded and used.
 *
 * Inlang considers an `undefined` locale to use the "development language" of
 * the project e.g. if your project is written in German, the development language
 * (fallback) language is German.
 */
let inlangLocale: string | undefined

/**
 * Loads the translations for a given locale via a network request.
 *
 * If the locale is undefined, no (new) translations are fetched. Previous fetches
 * are not overwridden but will not be used by the `t()` function.
 */
export async function loadTranslations(locale: string | undefined) {
    if (window === undefined) {
        throw Error(
            'Inlang only works in a browser environment where `window` is defined.'
        )
    }
    const hostname = window.location.hostname.replace('wwww.', '')
    inlangLocale = locale
    // if the global locale is defined -> load the translation for that locale
    if (inlangLocale) {
        inlangTranslations = await (
            await fetch(
                `https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${hostname}/${inlangLocale}.json`
            )
        ).json()
    }
    return inlangTranslations
}

/**
 * Translates given text based on the loaded translations.
 *
 * If the translations are `undefined`, or any error occurs, the provided (untranslated) text is
 * returned as fallback.
 *
 * Sometimes the latter case is intentional. Your development language
 * e.g. German, Spanish etc. does not need to be translated and for those locales no translations
 * exist.
 */
export function t(text: string) {
    const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim()
    if (inlangLocale && inlangTranslations) {
        try {
            if (inlangTranslations[trimmed]) {
                return inlangTranslations[trimmed]
            } else {
                // missing translation detected.
                // the fetch is async but it does not matter if an error occurs
                // some missing translation requests will make it through
                fetch('http://localhost:3000/api/missingTranslation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        projectId: 1,
                        key: trimmed,
                    }),
                })
            }
        } catch (_a) {
            return text
        }
    }
    return text
}

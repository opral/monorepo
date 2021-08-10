/**
 * The record contains all translations for a given locale.
 */
let inlangTranslations = null;
/**
 * The locale of the translations to be loaded and used.
 *
 * Inlang considers an `undefined` locale to use the "development language" of
 * the project e.g. if your project is written in German, the development language
 * (fallback) language is German.
 */
let inlangLocale;
let inlangProjectDomain;
async function postMissingTranslation(trimmedText) {
    try {
        await fetch('http://localhost:3000/api/missingTranslation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectDomain: inlangProjectDomain,
                key: trimmedText,
                locale: inlangLocale,
            }),
        });
    }
    catch (_a) {
        // pass
    }
}
/**
 * Loads the translations for a given locale via a network request for further
 * use internally but also returns the translations for external usage.
 *
 * @param projectDomain
 * @param locale
 *
 * If the locale is undefined, no (new) translations are fetched. Previous fetches
 * are not overwridden but will not be used by the `t()` function.
 */
export async function loadTranslations(projectDomain, locale) {
    inlangLocale = locale;
    inlangProjectDomain = projectDomain;
    // if the global locale is defined -> load the translation for that locale
    if (inlangLocale) {
        try {
            const response = await fetch(`https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${inlangProjectDomain}/${inlangLocale}.json`);
            if (response.ok) {
                inlangTranslations = await response.json();
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    return inlangTranslations;
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
export function t(text) {
    try {
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim();
        if (inlangLocale) {
            if (inlangTranslations) {
                if (inlangTranslations[trimmed]) {
                    return inlangTranslations[trimmed];
                }
                // the key does not exist, thus post as missing translation
                postMissingTranslation(trimmed);
            }
            else {
                // high chance that its a new project without any
                // tracked missing translations yet.
                postMissingTranslation(trimmed);
            }
        }
        return text;
    }
    catch (_a) {
        // in any case return the fallback text
        return text;
    }
}
//# sourceMappingURL=inlang.js.map
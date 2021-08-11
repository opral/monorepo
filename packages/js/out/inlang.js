/**
 * The locale of the current translations.
 *
 * Do not set the locale! Use `loadTranslations` instead to ensure that
 * the translations for the locale are loaded.
 *
 * `t` always returns the provided `text` as fallback when currentLocale is `undefined`.
 */
export let currentLocale;
/**
 * The record contains all translations for a given locale.
 */
let translations = null;
/**
 * The domain of the project.
 */
let inlangProjectDomain;
/**
 * Contains the missingTranslations that have been tracked already
 * in this session i.e. no need to make a new POST request.
 */
let trackedMissingTranslations;
async function postMissingTranslation(trimmedText) {
    try {
        if (trackedMissingTranslations[trimmedText] !== undefined) {
            // has been reported already, thus return
            return;
        }
        await fetch('http://localhost:3000/api/missingTranslation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectDomain: inlangProjectDomain,
                key: trimmedText,
                locale: currentLocale,
            }),
        });
        trackedMissingTranslations[trimmedText] = true;
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
    currentLocale = locale;
    inlangProjectDomain = projectDomain;
    trackedMissingTranslations = {};
    // if the global locale is defined -> load the translation for that locale
    if (currentLocale) {
        try {
            const response = await fetch(`https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${inlangProjectDomain}/${currentLocale}.json`);
            if (response.ok) {
                translations = await response.json();
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    return translations;
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
        if (currentLocale) {
            if (translations) {
                if (translations[trimmed]) {
                    return translations[trimmed];
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
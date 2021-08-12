/**
 * The locale of the current translations.
 *
 * `loadTranslation()` sets the locale.
 */
let SPECIFIED_LOCALE;
/**
 * The record contains all translations for a given locale.
 *
 * Can be undefined if you forgot to set the translations via
 * `setTranslations()`.
 */
let TRANSLATIONS;
/**
 * The domain of the project.
 */
let INLANG_PROJECT_DOMAIN;
/**
 * Contains the missingTranslations that have been tracked already
 * in this session i.e. no need to make a new POST request.
 *
 * The format follows either the key exists indicated by not `undefined`.
 * The boolean value is just a placeholder.
 */
let TRACKED_MISSING_TRANSLATIONS;
async function postMissingTranslation(trimmedText) {
    try {
        if (TRACKED_MISSING_TRANSLATIONS[trimmedText] !== undefined) {
            // has been reported already, thus return
            return;
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
        });
        TRACKED_MISSING_TRANSLATIONS[trimmedText] = true;
    }
    catch (_a) {
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
 * @param locale The locale of the translations to be loaded. Your user is from Germany?
 * Then the locale is "de". If the `developmentLocale` and `locale` are identical, pass
 * both e.g. `loadTranslations("example.com", "en", "en")
 *
 */
export async function loadTranslations(projectDomain, locale) {
    INLANG_PROJECT_DOMAIN = projectDomain;
    SPECIFIED_LOCALE = locale;
    TRACKED_MISSING_TRANSLATIONS = {};
    try {
        const response = await fetch(`https://drfmuzfjhdfivrwkoabs.supabase.in/storage/v1/object/public/translations/${INLANG_PROJECT_DOMAIN}/${SPECIFIED_LOCALE}.json`);
        if (response.ok) {
            return await response.json();
        }
        else {
            return {
                _inlangError: await response.text(),
            };
        }
    }
    catch (e) {
        return {
            _inlangError: e,
        };
    }
}
/**
 * Sets the translations internally which are used by the `t()` function.
 *
 * @param translations The translations as returned by `await loadTranslations(...args)`
 */
export function setTranslations(translations) {
    TRANSLATIONS = translations;
    if (TRANSLATIONS['_inlangError']) {
        console.error(`Error getting translations: ${TRANSLATIONS['_inlangError']}`);
    }
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
export function t(text) {
    if (TRANSLATIONS === undefined) {
        console.error(`
            The translations are undefined. Did you forget to set the translations
            via setTranslations()?
        `);
        return text;
    }
    // an error occured while fetching the translations which has been logged to
    // console in setTranslations
    else if (TRANSLATIONS['_inlangError']) {
        return text;
    }
    // no translations have been fetched since the locale is the development locale
    else if (TRANSLATIONS['_inlangProjectDevelopmentLanguage'] === SPECIFIED_LOCALE) {
        return text;
    }
    try {
        const trimmed = text.replace(/(?:\n(?:\s*))+/g, ' ').trim();
        if (TRANSLATIONS[trimmed]) {
            return TRANSLATIONS[trimmed];
        }
        // the key does not exist, thus post as missing translation
        postMissingTranslation(trimmed);
        return text;
    }
    catch (_a) {
        // if something goes wrong return the fallback text
        return text;
    }
}
//# sourceMappingURL=inlang.js.map
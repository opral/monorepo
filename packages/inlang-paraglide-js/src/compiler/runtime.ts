import type { ProjectSettings } from "@inlang/sdk2";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
  args: Pick<ProjectSettings, "baseLocale" | "locales">,
): string {
  return `/* eslint-disable */
/** @type {((locale: AvailableLocale) => void) | undefined} */ 
let _onSetLocale

/**
 * The project's base locale.
 * 
 * @example
 *   if (locale === baseLocale){
 *     // do something
 *   }
 */
export const baseLocale = "${args.baseLocale}"

/**
 * The project's locales.
 * 
 * @example 
 *   if (locales.includes(userSelectedLocale) === false){
 *     throw new Error("Locale is not available")
 *   }
 */
export const locales = /** @type {const} */ (${JSON.stringify(args.locales)})

/**
 * Get the current locale.
 * 
 * @example
 *   if (getLocale() === "de"){
 *     console.log("Germany 🇩🇪")
 *   } else if (getLocale() === "nl"){
 *     console.log("Netherlands 🇳🇱")
 *   }
 * 
 * @type {() => AvailableLocale}
 */
export let getLocale = () => baseLocale


/**
 * Set the locale to either a value or a getter function.
 * 
 * Setting the locale to a getter function enables dynamic locale resolution.
 * For example, you can resolve the locale on the server where every request 
 * has a different locale with \`setLocale(() => request.locale)\`.
 * 
 * @example 
 * 
 *   // changing to a locale 
 *   setLocale("en")
 * 
 *   // passing a getter function also works. 
 *   // 
 *   // a getter function is useful for resolving a locale
 *   // on the server where every request has a different locale
 *   setLocale(() => {
 *     return request.locale
 *   }) 
 *
 * @param {AvailableLocale | (() => AvailableLocale)} locale
 */
export const setLocale = (locale) => {
    if (typeof locale === "function") {
        getLocale = throwIfUnavailableLocale(locale)
    } else {
        getLocale = throwIfUnavailableLocale(() => locale)
    }
    // call the callback function if it has been defined
    if (_onSetLocale !== undefined) {
        _onSetLocale(getLocale())
    }
}

/** 
 * 
 *
 * @param {() => AvailableLocale} getLocale
 * @returns {() => AvailableLocale}
 */
function throwIfUnavailableLocale(getLocale) {
    return () => {
        const locale = getLocale()
        if(isAvailableLocale(locale) === false) {
            throw new Error(
                \`The locale "\${locale}" is not available. Add the locale "\${locale}" to the inlang project settings.\`
            )
        }
        return locale
    }
}

/**
 * Set the \`onSetLocale()\` callback function.
 *
 * The function can be used to trigger client-side side-effects such as 
 * making a new request to the server with the updated language tag, 
 * or re-rendering the UI on the client (SPA apps).  
 * 
 * - Don't use this function on the server (!).
 *   Triggering a side-effect is only useful on the client because a server-side
 *   environment doesn't need to re-render the UI. 
 *     
 * - The \`onSetLocale()\` callback can only be defined once to avoid unexpected behavior.
 * 
 * @example
 *   // if you use inlang paraglide on the server, make sure 
 *   // to not call \`onSetLocale()\` on the server
 *   if (isServer === false) {
 *     onSetLocale((locale) => {
 *       // (for example) make a new request to the 
 *       // server with the updated locale
 *       window.location.href = \`/\${locale}/\${window.location.pathname}\`
 *     })
 *   }
 *
 * @param {(locale: AvailableLocale) => void} fn
 */
export const onSetLocale = (fn) => {
    _onSetLocale = fn
}

/**
 * Check if something is an available locale.
 * 
 * @example
 * 	if (isLocale(params.locale)) {
 * 		setLocale(params.locale)
 * 	} else {
 * 		setLocale("en")
 * 	}
 * 
 * @param {any} locale
 * @returns {locale is AvailableLocale}
 */
export function isAvailableLocale(locale) {
    return locales.includes(locale)
}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 * 
 * @example
 *   setLocale(request.locale as AvailableLocale)
 * 
 * @typedef {typeof locales[number]} AvailableLocale
 */


// ------ LEGACY RUNTIME (will be removed in the next major version) ------
${legacyLanguageTagRuntime()}
`;
}

// remove with paraglide v3
const legacyLanguageTagRuntime = () => `

/**
 * @deprecated use \`baseLocale\` instead
 */
export const sourceLanguageTag = baseLocale

/**
 * @deprecated use \`locales\` instead
 */
export const availableLanguageTags = locales

/** 
 * @deprecated use \`getLocale()\` instead
 */
export let languageTag = getLocale

/**
 * @deprecated use \`setLocale()\` instead
 */
export const setLanguageTag = setLocale

/**
 * @deprecated use \`onSetLocale()\` instead
 */
export const onSetLanguageTag = _onSetLocale

/**
 * @deprecated use \`isAvailableLocale()\` instead
 * 
 * @returns {thing is AvailableLanguageTag}
 */
export const isAvailableLanguageTag = isAvailableLocale


/**
 * @deprecated use \`AvailableLocale\` instead
 * 
 * @typedef {typeof locales[number]} AvailableLanguageTag
 */`;

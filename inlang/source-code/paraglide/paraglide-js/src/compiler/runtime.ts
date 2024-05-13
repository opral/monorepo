import type { ProjectSettings } from "@inlang/sdk"

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
	opts: Pick<ProjectSettings, "languageTags" | "sourceLanguageTag">
): string {
	return `/* eslint-disable */
/** @type {((tag: AvailableLanguageTag) => void) | undefined} */ 
let _onSetLanguageTag

/**
 * The project's source language tag.
 * 
 * @example
 *   if (newlySelectedLanguageTag === sourceLanguageTag){
 *     // do nothing as the source language tag is the default language
 *     return
 *   }
 */
export const sourceLanguageTag = "${opts.sourceLanguageTag}"

/**
 * The project's available language tags.
 * 
 * @example 
 *   if (availableLanguageTags.includes(userSelectedLanguageTag) === false){
 *     throw new Error("Language tag not available")
 *   }
 */
export const availableLanguageTags = /** @type {const} */ (${JSON.stringify(opts.languageTags)})

/**
 * Get the current language tag.
 * 
 * @example
 *   if (languageTag() === "de"){
 *     console.log("Germany 🇩🇪")
 *   } else if (languageTag() === "nl"){
 *     console.log("Netherlands 🇳🇱")
 *   }
 * 
 * @type {() => AvailableLanguageTag}
 */
export let languageTag = () => sourceLanguageTag

/**
 * Set the language tag.
 * 
 * @example 
 * 
 *   // changing to language 
 *   setLanguageTag("en")
 * 
 *   // passing a getter function also works. 
 *   // 
 *   // a getter function is useful for resolving a language tag 
 *   // on the server where every request has a different language tag
 *   setLanguageTag(() => {
 *     return request.langaugeTag
 *   }) 
 *
 * @param {AvailableLanguageTag | (() => AvailableLanguageTag)} tag
 */
export const setLanguageTag = (tag) => {
    if (typeof tag === "function") {
        languageTag = enforceLanguageTag(tag)
    } else {
        languageTag = enforceLanguageTag(() => tag)
    }
    // call the callback function if it has been defined
    if (_onSetLanguageTag !== undefined) {
        _onSetLanguageTag(languageTag())
    }
}

/**
 * Wraps an untrusted function and enforces that it returns a language tag.
 * @param {() => AvailableLanguageTag} unsafeLanguageTag
 * @returns {() => AvailableLanguageTag}
 */
function enforceLanguageTag(unsafeLanguageTag) {
    return () => {
        const tag = unsafeLanguageTag()
        if(!isAvailableLanguageTag(tag)) {
            throw new Error(\`languageTag() didn't return a valid language tag. Check your setLanguageTag call\`)
        }
        return tag
    }
}

/**
 * Set the \`onSetLanguageTag()\` callback function.
 *
 * The function can be used to trigger client-side side-effects such as 
 * making a new request to the server with the updated language tag, 
 * or re-rendering the UI on the client (SPA apps).  
 * 
 * - Don't use this function on the server (!).
 *   Triggering a side-effect is only useful on the client because a server-side
 *   environment doesn't need to re-render the UI. 
 *     
 * - The \`onSetLanguageTag()\` callback can only be defined once to avoid unexpected behavior.
 * 
 * @example
 *   // if you use inlang paraglide on the server, make sure 
 *   // to not call \`onSetLanguageTag()\` on the server
 *   if (isServer === false) {
 *     onSetLanguageTag((tag) => {
 *       // (for example) make a new request to the 
 *       // server with the updated language tag
 *       window.location.href = \`/\${tag}/\${window.location.pathname}\`
 *     })
 *   }
 *
 * @param {(languageTag: AvailableLanguageTag) => void} fn
 */
export const onSetLanguageTag = (fn) => {
    _onSetLanguageTag = fn
}

/**
 * Check if something is an available language tag.
 * 
 * @example
 * 	if (isAvailableLanguageTag(params.locale)) {
 * 		setLanguageTag(params.locale)
 * 	} else {
 * 		setLanguageTag("en")
 * 	}
 * 
 * @param {any} thing
 * @returns {thing is AvailableLanguageTag}
 */
export function isAvailableLanguageTag(thing) {
    return availableLanguageTags.includes(thing)
}

// ------ TYPES ------

/**
 * A language tag that is available in the project.
 * 
 * @example
 *   setLanguageTag(request.languageTag as AvailableLanguageTag)
 * 
 * @typedef {typeof availableLanguageTags[number]} AvailableLanguageTag
 */`
}

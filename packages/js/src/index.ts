import { UninitializedError } from './errors'
import { Inlang } from './inlang'
import { InlangTextApi } from './inlangTextApi'
import type { Locale } from './types'

let INLANG: Inlang | undefined

/**
 * @summary
 * Initializes a new Inlang object containing the translations for the
 * given locale.
 *
 * @param projectDomain The domain of the project.
 * @param locale The locale of the translations to be loaded.
 * @param textApi The text api to be used. If undefined `InlangTextApi` is used.
 * @returns Inlang instance
 *
 * @example
 * ```JS
 * setTranslations(await loadTranslations({ ...args }))
 * t('Hello {user}')
 *   .variables({user: "Samuel"})
 * >>> "Bonjour Samuel"
 * ```
 */
export function loadTranslations(args: {
    projectDomain: string
    locale: Locale
    textApi?: typeof InlangTextApi
}): Promise<Inlang> {
    return Inlang.loadTranslations({ ...args })
}

/**
 * @param inlangInstace An initialized Inlang object. Usually retrieved from `loadTranslations()`
 */
export function setTranslations(inlangInstace: Inlang): void {
    INLANG = inlangInstace
}

/**
 *
 * @returns InlangTextApi which can be converted to a string via `toString()`.
 * Most of the times, toString is automatically called from the Frontent library.
 *
 * @example
 * ```JS
 * const nrTodos = 0
 * 
 * t("Hello {planet}, you have { num } todos.")
 *   .variables({ planet : "World", num: nrTodos })
 *   .plurals(nrTodos, { zero: "Hello { planet }, you have no todos."})
 * 
 * >>> "Hello World, you have no todos."
 * ```
 */
export function t(text: string): InlangTextApi {
    if (INLANG === undefined) {
        throw new UninitializedError()
    }
    return INLANG.translate(text)
}

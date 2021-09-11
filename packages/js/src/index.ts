import { UninitializedError } from './errors'
import { Inlang } from './inlang'
import { InlangTextApi } from './inlangTextApi'
import type { Locale } from './types'

let INLANG: Inlang | undefined

/**
 * @summary
 * Initializes a new Inlang object containing the translations for the
 * given locale which is returned as JSON string. The latter allows to
 * pass the translations from server-side to client-side necessary for
 * Server Side Rendering (SSR).
 *
 * @param projectDomain The domain of the project.
 * @param locale The locale of the translations to be loaded.
 * @param textApi The text api to be used. If undefined `InlangTextApi` is used.
 * @returns JSON which contains an instance of Inlang.
 *
 * @example
 * ```JS
 * setTranslations(await loadTranslations({ ...args }))
 * t('Hello {user}')
 *   .variables({user: "Samuel"})
 * >>> "Bonjour Samuel"
 * ```
 */
export async function loadTranslations(args: {
    projectDomain: string
    locale: Locale
    textApi?: typeof InlangTextApi
}): Promise<string> {
    const instance = await Inlang.loadTranslations({ ...args })
    return instance.toJson()
}

/**
 * @param inlangInstace An initialized Inlang object. Usually retrieved from `loadTranslations()`
 */
export function setTranslations(inlangInstaceAsJson: string): void {
    INLANG = Inlang.fromJson(inlangInstaceAsJson)
}

/**
 *
 * @returns translation
 *
 * @example
 * ```JS
 * const nrTodos = 0
 *
 * t("Hello {planet}, you have { num } todos.")
 *   .variables({ planet : "World", num: nrTodos })
 *
 * >>> "Hello World, you have no todos."
 * ```
 */
export function t(
    text: string,
    options?: { vars?: Record<string, string | number> }
): string {
    if (INLANG === undefined) {
        throw new UninitializedError()
    }
    return INLANG.textApi(text).variables(options?.vars).toString()
}

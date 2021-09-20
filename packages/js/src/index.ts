import { Inlang } from './inlang'
//@ts-ignore
import translations from '../translations/translations'
//@ts-ignore
import projectConfig from '../translations/config'
import { InlangTranslateArgs, Locale } from './types'

export { Inlang }

let inlang: Inlang | undefined

/**
 * Auto-configuration based on the translation directory.
 *
 * Only works in a browser environment as document.documentElement
 * is used to derive the current language of the website.
 *
 * Use the Inlang class for fine grained configuration of inlang.
 *
 * @returns translated text (if exists)
 */
export function t(text: string, args?: InlangTranslateArgs): string {
    if (inlang === undefined) {
        inlang = new Inlang({
            projectConfig: projectConfig,
            translations: translations,
            locale: document.documentElement.lang as Locale,
        })
    }
    return inlang.translate(text, args)
}

import { Inlang } from './inlang'
import type { Locale } from './types'

export function loadTranslations(args: {
    projectDomain: string
    locale: Locale
}): Promise<Inlang> {
    return Inlang.loadTranslations({ ...args })
}

import { PluralRules, Locale } from './types'

export function pluralize(args: {
    text: string
    definedPlurals: PluralRules
    num: number
    locale: Locale
}): string {
    // Zero should be zero in any language.
    if (args.num === 0) {
        return args.definedPlurals.zero ?? args.text
    }
    const rule = new Intl.PluralRules(args.locale).select(args.num)
    switch (rule) {
        case 'zero':
            return args.definedPlurals.zero ?? args.text
        case 'one':
            return args.definedPlurals.one ?? args.text
        case 'two':
            return args.definedPlurals.two ?? args.text
        case 'few':
            return args.definedPlurals.few ?? args.text
        case 'many':
            return args.definedPlurals.many ?? args.text
    }
    return args.text
}

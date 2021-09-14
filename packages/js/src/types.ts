/**
 * A single translation.
 */
// export type SingleTranslation = { default: string } & PluralRules

export type SingleTranslation = string

/**
 * @example The key is the default language of the project.
 * {
 *   "Hello World": {
 *     "de": "Hallo Welt"
 *     "fr": "Bonjour le monde"
 *   }
 *   ...
 * }
 */
export type Translations = {
    [key: string]:
        | {
              [locale: string]: string | undefined
          }
        | undefined
}

export type InlangProjectConfig = {
    projectId: string
    developmentLocale: Locale
    locales: Locale[]
}

/**
 * Pluralization rule for the given locale.
 *
 * Be aware that not every langauge has every rule. For example, english does not
 * have the rule "two" but only `zero`,`one`,`other`. Whereas `other` does not exist.
 * "Other" is more like default which is whatever you pass into
 * `t("this text is the default also called other")`
 *
 * Uses [Unicode plural rules](http://cldr.unicode.org/index/cldr-spec/plural-rules) which is
 * built into JavaScripts [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules)
 */
export type PluralRules = {
    zero?: string
    one?: string
    two?: string
    few?: string
    many?: string
}

/**
 * Iso 639-1 locale
 *
 */
export type Locale =
    | 'ab'
    | 'aa'
    | 'af'
    | 'ak'
    | 'sq'
    | 'am'
    | 'ar'
    | 'an'
    | 'hy'
    | 'as'
    | 'av'
    | 'ae'
    | 'ay'
    | 'az'
    | 'bm'
    | 'ba'
    | 'eu'
    | 'be'
    | 'bn'
    | 'bh'
    | 'bi'
    | 'bs'
    | 'br'
    | 'bg'
    | 'my'
    | 'ca'
    | 'km'
    | 'ch'
    | 'ce'
    | 'ny'
    | 'zh'
    | 'cu'
    | 'cv'
    | 'kw'
    | 'co'
    | 'cr'
    | 'hr'
    | 'cs'
    | 'da'
    | 'dv'
    | 'nl'
    | 'dz'
    | 'en'
    | 'eo'
    | 'et'
    | 'ee'
    | 'fo'
    | 'fj'
    | 'fi'
    | 'fr'
    | 'ff'
    | 'gd'
    | 'gl'
    | 'lg'
    | 'ka'
    | 'de'
    | 'ki'
    | 'el'
    | 'kl'
    | 'gn'
    | 'gu'
    | 'ht'
    | 'ha'
    | 'he'
    | 'hz'
    | 'hi'
    | 'ho'
    | 'hu'
    | 'is'
    | 'io'
    | 'ig'
    | 'id'
    | 'ia'
    | 'ie'
    | 'iu'
    | 'ik'
    | 'ga'
    | 'it'
    | 'ja'
    | 'jv'
    | 'kn'
    | 'kr'
    | 'ks'
    | 'kk'
    | 'rw'
    | 'kv'
    | 'kg'
    | 'ko'
    | 'kj'
    | 'ku'
    | 'ky'
    | 'lo'
    | 'la'
    | 'lv'
    | 'lb'
    | 'li'
    | 'ln'
    | 'lt'
    | 'lu'
    | 'mk'
    | 'mg'
    | 'ms'
    | 'ml'
    | 'mt'
    | 'gv'
    | 'mi'
    | 'mr'
    | 'mh'
    | 'ro'
    | 'mn'
    | 'na'
    | 'nv'
    | 'nd'
    | 'ng'
    | 'ne'
    | 'se'
    | 'no'
    | 'nb'
    | 'nn'
    | 'ii'
    | 'oc'
    | 'oj'
    | 'or'
    | 'om'
    | 'os'
    | 'pi'
    | 'pa'
    | 'ps'
    | 'fa'
    | 'pl'
    | 'pt'
    | 'qu'
    | 'rm'
    | 'rn'
    | 'ru'
    | 'sm'
    | 'sg'
    | 'sa'
    | 'sc'
    | 'sr'
    | 'sn'
    | 'sd'
    | 'si'
    | 'sk'
    | 'sl'
    | 'so'
    | 'st'
    | 'nr'
    | 'es'
    | 'su'
    | 'sw'
    | 'ss'
    | 'sv'
    | 'tl'
    | 'ty'
    | 'tg'
    | 'ta'
    | 'tt'
    | 'te'
    | 'th'
    | 'bo'
    | 'ti'
    | 'to'
    | 'ts'
    | 'tn'
    | 'tr'
    | 'tk'
    | 'tw'
    | 'ug'
    | 'uk'
    | 'ur'
    | 'uz'
    | 've'
    | 'vi'
    | 'vo'
    | 'wa'
    | 'cy'
    | 'fy'
    | 'wo'
    | 'xh'
    | 'yi'
    | 'yo'
    | 'za'
    | 'zu'

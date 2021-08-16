/**
 * Translations are an object for a specific locale.
 * The object for a "de" (German) locale might look as follows:
 * ```JS
 * {
 *  "Hello": "Hallo",
 *  "Calculator": "Taschenrechner"
 *  ...
 * }
 * ```
 *
 * Note that keys can be undefined e.g. `translations["Phone"]` -> `undefined`.
 */
export type Translations = {
    [key: string]: string | undefined
}

// /**
//  * @param projectDomain The domain you specified when creating your inlang project.
//  * @param developmentLocale The locale in which the app is developed. All your text is
//  * english? Then your development locale is "en".
//  * @param locale The locale of the translations to be loaded. Your user is from Germany?
//  * Then the locale is "de". If the `developmentLocale` and `locale` are identical, pass
//  * both e.g. `loadTranslations("example.com", "en", "en")
//  */
// export type LoadTranslationsArgs = {
//     projectDomain: string,
//     developmentLocale: string,
//     locale: string
// }

/**
 * Pluralization rule for the given locale. 
 * 
 * Be aware that not every langauge has every rule. For example, english does not 
 * have the rule "two" but only `zero`,`one`,`other`. Whereas `other` is always 
 * the intial translation passed into `t("this text is other")`
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

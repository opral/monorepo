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

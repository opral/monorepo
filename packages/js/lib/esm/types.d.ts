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
export declare type Translations = {
    [key: string]: string | undefined;
};

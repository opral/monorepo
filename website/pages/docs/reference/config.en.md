# Config Reference

For a full, and always up to date, reference go to [@inlang/config](https://github.com/inlang/inlang/tree/main/packages/config/src/schemas).

`inlang.config.json`

```ts
{
    /**
     * A link to the JSON schema.
     *
     * Go to https://github.com/inlang/inlang/tree/main/packages/config/src/schemas to see a list of all schemas.
     *
     * Using a schema enables auto-complete and linting in most IDE's via https://json-schema.org/.
     * Furthermore, defining a version of the config file allows for changes down the line with auto-migration scripts.
     */
    $schema: string;
    /**
     * The file format of the local translation files.
     *
     * Any other file format than Fluent makes use of a converter.
     * Read more about converters and their limitations here https://inlang.dev/architecture/overview#support-for-file-formats-other-than-fluent.
     */
    fileFormat: string;
    /**
     * Where and how the local translation files are saved.
     *
     * Use '{languageCode}' as dynamic value.
     * @examples
     * 		`./translations/{languageCode}.json`
     * 		.`/{languageCode}/Localizable.strings`
     */
    pathPattern: string;
    /**
     * A link to the pegjs grammar to detect the usage of i18n (translations) in the source code.
     *
     * Go to https://github.com/inlang/inlang/tree/main/packages/i18n-detection/src/grammars for predefined grammars.
     *
     * Using a link offers flexibility to define own grammars for specific environments. Go to
     */
    fetchI18nDetectionGrammarFrom?: string;
    /**
     * The replacement options when extracting pattern.
     *
     * Must include `{id}` in all options.
     * @example
     * 		['t("{id}")', 'i18n.{id}']
     */
    extractPatternReplacementOptions?: string[];
    /**
     * An ISO 639-1 human language code that determines the base language.
     */
    baseLanguageCode?: string;
}
```

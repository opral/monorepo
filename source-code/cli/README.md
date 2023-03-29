# @inlang/cli

## Commands

### `init`

Interactive configuration and creation of the `inlang.config.json`.

### `remote download`

Downloads the translations and _OVER-WRITES_ the local files.

**Example**

`inlang remote download --path-pattern ./translations/{languageCode}.ftl --api-key <your api key> --format fluent`

**Flags**

`--format: string`

If your environment uses a different translation format than Fluent, a converter is used to transform the format to and from Fluent.

`--path-pattern: string`

Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.

_Examples_

--path-pattern ./translations/{languageCode}.ftl

--path-pattern ./{languageCode}/Localizable.strings

`--api-key: string`
The api key for the project.

### `remote upload`

Uploads the local files and _OVERWRITES_ the remote files.

**Example**

`inlang remote upload --path-pattern ./translations/{languageCode}.ftl --api-key <your api key>`

**Flags**

`--format: string`

If your environment uses a different translation format than Fluent, a converter is used to transform the format to and from Fluent.

`--path-pattern: string`

Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.

_Examples_

--path-pattern ./translations/{languageCode}.ftl

--path-pattern ./{languageCode}/Localizable.strings

`--api-key: string`

The api key for the project.

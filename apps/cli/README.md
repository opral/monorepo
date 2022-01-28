# @inlang/cli

Synchronize your local files with the remote files.

## Commands

### `download`

Downloads the translations and _OVER-WRITES_ the local files.

**Example**

`inlang download --path-pattern ./translations/{languageCode}.ftl --api-key <your api key>`

**Flags**

`--adapter: string`

Inlang uses Mozillas Fluent syntax. If your environment uses a different translation syntax, you can specify an adapter (to adapt to your environment).

`--path-pattern: string`

Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.

_Examples_

--path-pattern ./translations/{languageCode}.ftl

--path-pattern ./{languageCode}/Localizable.strings

`--api-key: string`
The api key for the project.

### `upload`

Uploads the local files and _OVERWRITES_ the remote files.

**Example**

`inlang upload --path-pattern ./translations/{languageCode}.ftl --api-key <your api key>`

**Flags**

`--adapter: string`

Inlang uses Mozillas Fluent syntax. If your environment uses a different translation syntax, you can specify an adapter (to adapt to your environment).

`--path-pattern: string`

Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.

_Examples_

--path-pattern ./translations/{languageCode}.ftl

--path-pattern ./{languageCode}/Localizable.strings

`--api-key: string`

The api key for the project.

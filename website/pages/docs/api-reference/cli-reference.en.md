# Command-Line Reference

The CLI enables seamless synchronization of source code files with remote files used by the inlang dashboard.
In the future, the CLI could become more advanced with linting and other features. Take part in the
[discussions](https://github.com/inlang/inlang/discussions).

## Commands

### `download`

Downloads the translations and _OVER-WRITES_ the local files.

**Example**

`inlang download --path-pattern ./translations/{languageCode}.ftl --api-key <your api key>`

**Flags**

`--adapter: string`

Inlang uses Mozillas Fluent syntax. If your environment uses a different translation syntax, you can specify an adapter (to adapt to your environment).

`--path-pattern: string`

Where and how the translation files should be saved. Use "\{languageCode\}" as dynamic value.

_Examples_

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

Where and how the translation files should be saved. Use "\{languageCode\}" as dynamic value.

_Examples_

--path-pattern ./translations/\{languageCode\}.ftl

--path-pattern ./\{languageCode\}/Localizable.strings

`--api-key: string`

The api key for the project.

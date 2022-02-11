# Command-Line Reference

The CLI enables seamless synchronization of source code files with remote files used by the inlang dashboard.
In the future, the CLI could become more advanced with linting and other features. Take part in the
[discussions](https://github.com/inlang/inlang/discussions).

## Installation

The CLI requires [node](https://nodejs.org) to be installed on your machine. Since the CLI is distributed via
NPM, you can simply `npm i @inlang/cli --save-dev`

**In a Node.js project**

1. install via `npm i @inlang/cli --save-dev`
2. run `npx inlang <command>`

**Other**

1. install the CLI globally via `npm i @inlang/cli -g`
2. run `inlang <command>`

## Commands

### `init`

Interactive configuration and creation of the `inlang.config.json`.

### `remote download`

Downloads the translations and _OVER-WRITES_ the local files.

**Example**

`inlang remote download --path-pattern ./translations/\{languageCode\}.ftl --api-key <your api key> --format fluent`

**Flags**

`--format: string`

If your environment uses a different translation format than Fluent, a converter is used to transform the format to and from Fluent.

`--path-pattern: string`

Where and how the translation files should be saved. Use "\{languageCode\}" as dynamic value.

_Examples_

--path-pattern ./translations/\{languageCode\}.ftl

--path-pattern ./\{languageCode\}/Localizable.strings

`--api-key: string`
The api key for the project.

### `remote upload`

Uploads the local files and _OVERWRITES_ the remote files.

**Example**

`inlang remote upload --path-pattern ./translations/\{languageCode\}.ftl --api-key <your api key>`

**Flags**

`--format: string`

If your environment uses a different translation format than Fluent, a converter is used to transform the format to and from Fluent.

`--path-pattern: string`

Where and how the translation files should be saved. Use "\{languageCode\}" as dynamic value.

_Examples_

--path-pattern ./translations/\{languageCode\}.ftl

--path-pattern ./\{languageCode\}/Localizable.strings

`--api-key: string`

The api key for the project.

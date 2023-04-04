# @inlang/cli

## Installation

You can install the @inlang/cli with this command:

```sh
npm install @inlang/cli -g
```

or

```sh
yarn global add @inlang/cli
```

If you have `npx` installed, you can simply type: `npx @inlang/cli`.

## Commands

The following commands are available with the inlang CLI:

### `config`

The `config` command is used to interactively configure and create the inlang.config.json file.

#### `config init`

This command scans your file system hierarchy and finds out how your localization files are setup.
It returns a complete config for you to use in your project, which you can modify to your needs.

To use the `config init` command, simply run:

```sh
inlang config init
# or
npx @inlang/cli config init
```

This will launch an interactive prompt that will guide you through the process of creating the inlang configuration file.

<!--
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

The api key for the project. -->

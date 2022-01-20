@inlang/cli
===========

TODO

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@inlang/cli.svg)](https://npmjs.org/package/@inlang/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@inlang/cli.svg)](https://npmjs.org/package/@inlang/cli)
[![License](https://img.shields.io/npm/l/@inlang/cli.svg)](https://github.com/inlang/inlang/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @inlang/cli
$ inlang COMMAND
running command...
$ inlang (-v|--version|version)
@inlang/cli/0.1.3 linux-x64 node-v14.18.1
$ inlang --help [COMMAND]
USAGE
  $ inlang COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`inlang download`](#inlang-download)
* [`inlang help [COMMAND]`](#inlang-help-command)
* [`inlang keyCreate`](#inlang-keycreate)
* [`inlang lint`](#inlang-lint)
* [`inlang upload`](#inlang-upload)

## `inlang download`

Download the translations for a specific project.

```
USAGE
  $ inlang download

OPTIONS
  --adapter=swift|typesafe-i18n|fluent  (required) The adapter used to parse from and to inlang's schema.
  --apikey=apikey                       (required) The apikey of the project found at https://app.inlang.dev/
  --force                               Overwrite local translation files regardless of merge conflicts.

  --path-pattern=path-pattern           (required) Where and how the translation files should be saved. You can use
                                        "{languageCode}" as dynamic value.
                                        [examples]
                                        ./translations/{languageCode}.json
                                        ./{languageCode}/Localizable.strings
```

_See code: [src/commands/download.ts](https://github.com/inlang/inlang/blob/v0.1.3/src/commands/download.ts)_

## `inlang help [COMMAND]`

display help for inlang

```
USAGE
  $ inlang help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.7/src/commands/help.ts)_

## `inlang keyCreate`

Download the translations for a specific project.

```
USAGE
  $ inlang keyCreate

OPTIONS
  --adapter=swift|typesafe-i18n|fluent  (required) The adapter used to parse from and to inlang's schema.
  --baseLanguage=baseLanguage           (required) The base language of the project
  --baseTranslation=baseTranslation     (required) The base translation for the translation key-pairs
  --key=key                             (required) The name of the key for the translation key-pairs

  --path-pattern=path-pattern           (required) Where and how the translation files should be saved. You can use
                                        "{languageCode}" as dynamic value.
                                        [examples]
                                        ./translations/{languageCode}.json
                                        ./{languageCode}/Localizable.strings
```

_See code: [src/commands/keyCreate.ts](https://github.com/inlang/inlang/blob/v0.1.3/src/commands/keyCreate.ts)_

## `inlang lint`

Download the translations for a specific project.

```
USAGE
  $ inlang lint

OPTIONS
  --adapter=swift|typesafe-i18n|fluent  (required) The adapter used to parse from and to inlang's schema.

  --path-pattern=path-pattern           (required) Where and how the translation files should be saved. You can use
                                        "{languageCode}" as dynamic value.
                                        [examples]
                                        ./translations/{languageCode}.json
                                        ./{languageCode}/Localizable.strings
```

_See code: [src/commands/lint.ts](https://github.com/inlang/inlang/blob/v0.1.3/src/commands/lint.ts)_

## `inlang upload`

Download the translations for a specific project.

```
USAGE
  $ inlang upload

OPTIONS
  --adapter=swift|typesafe-i18n|fluent  (required) The adapter used to parse from and to inlang's schema.
  --apikey=apikey                       (required) The apikey of the project found at https://app.inlang.dev/
  --force                               Overwrite local translation files regardless of merge conflicts.

  --path-pattern=path-pattern           (required) Where and how the translation files should be saved. You can use
                                        "{languageCode}" as dynamic value.
                                        [examples]
                                        ./translations/{languageCode}.json
                                        ./{languageCode}/Localizable.strings
```

_See code: [src/commands/upload.ts](https://github.com/inlang/inlang/blob/v0.1.3/src/commands/upload.ts)_
<!-- commandsstop -->

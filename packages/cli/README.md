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
@inlang/cli/0.0.0 darwin-arm64 node-v14.17.4
$ inlang --help [COMMAND]
USAGE
  $ inlang COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`inlang hello [FILE]`](#inlang-hello-file)
* [`inlang help [COMMAND]`](#inlang-help-command)

## `inlang hello [FILE]`

describe the command here

```
USAGE
  $ inlang hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ inlang hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/inlang/inlang/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->

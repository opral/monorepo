# Introduction

[@inlang/cli](https://github.com/inlang/monorepo/tree/main/inlang/source-code/cli) is a command line interface (CLI) tool that allows you to interact with the Inlang infrastructure. It can be used to automate localization tasks, such as machine translation, lining, and more.

### Benefits

- ✨ **Automate** tedious localization tasks
- ⚙️ Integrate localization into your **CI/CD** pipeline
- 🔍 **Lint** your translations
- 🤖 **Machine translate** your resources
- 🖊️ Open the web editor right from the command line
- ✅ Validate your `project.inlang.json` configuration file

# Installation

## Install with package manager

You can install the @inlang/cli with this command:

```sh
npm install @inlang/cli
```

or

```sh
yarn add @inlang/cli
```

best

```sh
npx @inlang/cli [command]
```

## Minimum requirements

Minimum node version: `v18.0.0`

If one of the commands can't be found, you are probably using an outdated version of the CLI. You can always get the **latest version** by running `npx @inlang/cli@latest [command]`.

# Commands

We recommend using the CLI with `npx` to avoid installing the CLI globally. Not installing the CLI globally has the following advantages:

- the installed CLI version is scoped to the project, ensuring that it always works.
- the CLI gets installed for team members, avoiding "why is this command not working for me" questions.

`npx` is auto-installed with Node and NPM.

If one of the commands can't be found, you are probably using an outdated version of the CLI. You can always get the **latest version** by running `npx @inlang/cli@latest [command]`.

```sh
CLI for inlang.

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  project [command]  Commands for managing your inlang project
  lint [options]     Commands for linting translations.
  machine [command]  Commands for automating translations.
  open [command]     Commands for open parts of the inlang ecosystem.
  module [command]   Commands for build inlang modules.
  help [command]     display help for command
```

The following commands are available with the inlang CLI:

## `machine`

The machine command is used to automate localization processes.

### `machine translate`

The translate command machine translates all resources.

To initiate machine translation, run the following command:

```sh
npx @inlang/cli machine translate
```

**Options**

The translate command has the following options:

- `-f, --force`: If this option is set, the command will not prompt confirmation. This is useful for CI/CD build pipelines. **We advise you to only use `machine translate` in build pipelines to avoid out-of-context/wrong translations.**

- `--project <path>`: Specifies the path to the project root. The default project root is the current working directory.

This command reads the project.inlang.json file in the repository and retrieves the resources and reference language specified in the configuration. It then translates all messages from the reference language to other languages defined in the configuration.

The translations are performed using machine translation services. The translated messages are added to the respective language resources. Finally, the updated resources are written back to the file system.

> Note: The project.inlang.json file must be present in the repository for the translation to work.

## `project`

The project command is used to interact with the Inlang project. It allows to create a new project or migrate an existing project to the new `project.inlang.json`.

This will launch an interactive prompt that will guide you through the process of creating the inlang configuration file.

### `project validate`

Validates a project.

```sh
npx @inlang/cli project validate
```

**Options**

The translate command has the following options:

- `--project <path>`: Specifies the path to the project root. The default project root is the current working directory.

This will launch an interactive prompt that will guide you through the process of migrating the inlang configuration file.

## `lint`

The lint command lints the translation with the configured lint rules, for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules).

```sh
npx @inlang/cli lint
```

**Options**

The translate command has the following options:

- `--no-fail`: If this option is set, the command will not fail if there are any linting errors.
- `--project <path>`: Specifies the path to the project root. The default project root is the current working directory.
- `--languageTags <tags>`: Specifies the language tags to lint. Defaults to all. Should be a comma-separated list of language tags specified in the `project.inlang.json`, e.g. `en,de,fr`.

`lint` will read through all resources and find potential errors and warnings in the translation strings, for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules), it searches for **missing messages**, **missing references** and **identical patterns/duplicates**.

However, it's totally up to you how you configure your lints. _You can build your own plugin with your customized set of lints_ with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules) as a starter template.

## `open`

The open command opens parts of the Inlang infrastructure in your default browser.

### `open editor`

The editor command opens the Inlang editor for the current repository.

To open the Inlang editor, run the following command:

```sh
npx @inlang/cli open editor
```

This command retrieves the remote URL of the repository and constructs the URL for the Inlang editor by appending the GitHub user and repository to https://inlang.com/editor/. The editor will be opened in your default browser.

## `module`

The module command is used to interact with the Inlang module. It allows to initialize a new module or run the modules build commands.

### `module init`

The `module init` command initialize a new Inlang module in the current directory. This works only if the current directory is empty, so make sure to create a new folder.

To initialize a new module, run the following command:

```sh
npx @inlang/cli module init
```

**Options**

The init command has the following options:
`--type <type>`: The type of the module. Currently, `lintRule` or `plugin` is supported.

### `module build`

If you are developing an inlang module, the `module build` command builds your Inlang module for development & in production.

To build a module, run the following command:

```sh
npx @inlang/cli module build --entry ./path/to/index.ts --outdir ./path/to/dist
```

**Options**

`--entry <entry>`: Specifies the path to the entry point of the module, typically src/index.js or src/index.ts.
`--outdir <path>`: Specifies the output directory for the build files. The default output directory is "./dist."
`--watch`: An optional flag that, when provided, enables a watch mode to monitor for changes and automatically rebuild the module when changes are detected.

See how there is also a `--watch` flag, which enables a watch mode to monitor for changes and automatically rebuild the module when changes are detected. This command runs with `esbuild` under the hood.
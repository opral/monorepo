---
title: CLI for globalizing with inlang
shortTitle: CLI
href: /documentation/apps/inlang-cli
description: The inlang Command Line Interface (CLI) automates globalization processes.
---

# Inlang CLI

[@inlang/cli](https://github.com/inlang/monorepo/tree/main/inlang/source-code/cli) is a command line interface (CLI) tool that allows you to interact with the Inlang infrastructure. It can be used to automate localization tasks, such as machine translation, lining, and more.

### Benefits

- ✨ **Automate** tedious localization tasks
- ⚙️ Integrate localization into your **CI/CD** pipeline
- 🔍 **Lint** your translations
- 🤖 **Machine translate** your resources
- 🖊️ Open the web editor right from the command line
- ✅ Validate your `project.inlang.json` configuration file

## Installation

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

Minimum node version: `v18.0.0`

If one of the commands can't be found, you are probably using an outdated version of the CLI. You can always get the **latest version** by running `npx @inlang/cli@latest [command]`.

## Commands

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
  config [command]   Commands for managing the config file.
  project [command]  Commands for managing your inlang project
  lint [options]     Commands for linting translations.
  machine [command]  Commands for automating translations.
  open [command]     Commands for open parts of the inlang ecosystem.
  module [command]   Commands for build inlang modules.
  help [command]     display help for command
```

The following commands are available with the inlang CLI:

### `config`

The config command is used to interactively configure and create the project.inlang.json file.

#### `config init`

This command scans your file system hierarchy and finds out how your localization files are setup.
It returns a complete config for you to use in your project, which you can modify to your needs.

To use the `config init` command, simply run the following:

```sh
npx @inlang/cli config init
```

This will launch an interactive prompt that will guide you through the process of creating the inlang configuration file.

#### `config validate`

This command validates the `project.inlang.json` file in the current directory. It checks if the file is valid JSON and if it contains **all required fields**. It also checks if the specified resources exist and performs a _dry run of the translation process_.

To validate the `project.inlang.json` file, run the following command:

```sh
npx @inlang/cli config validate
```

#### `config update`

This command updates the `project.inlang.json` file with the latest versions of the plugins used. This is helpful if you want to **update your plugins** to the latest major version and don't want to look them up manually.

Keep in mind updating to a new major version might break your configuration. _We recommend always checking the changelog of the plugin before updating._

To update the `project.inlang.json` file, run the following command:

```sh
npx @inlang/cli config update
```

### `machine`

The machine command is used to automate localization processes.

#### `machine translate`

The translate command machine translates all resources.

To initiate machine translation, run the following command:

```sh
npx @inlang/cli machine translate
```

**Options**

The translate command has the following options:

- `-f, --force`: If this option is set, the command will not prompt confirmation. This is useful for CI/CD build pipelines. **We advise you to only use `machine translate` in build pipelines to avoid out-of-context/wrong translations.**

This command reads the project.inlang.json file in the repository and retrieves the resources and reference language specified in the configuration. It then translates all messages from the reference language to other languages defined in the configuration.

The translations are performed using machine translation services. The translated messages are added to the respective language resources. Finally, the updated resources are written back to the file system.

> Note: The project.inlang.json file must be present in the repository for the translation to work.

### `project`

The project command is used to interact with the Inlang project. It allows to create a new project or migrate an existing project to the new `project.inlang.json`.

#### `project init`

The init command initialize a new Inlang project at `./project.inlang.json` with optional module configuration.

To initialize a new project, run the following command:

```sh
npx @inlang/cli project init
```

This will launch an interactive prompt that will guide you through the process of creating the inlang configuration file.

#### `project migrate`

The migrate command migrates an existing Inlang project from the old `inlang.config.js` to the new `project.inlang.json` format.

To migrate an existing project, run the following command:

```sh
npx @inlang/cli project migrate
```

This will launch an interactive prompt that will guide you through the process of migrating the inlang configuration file.

### `lint`

The lint command lints the translation with the configured lint rules, for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules).

```sh
npx @inlang/cli lint
```

The `lint` command is provided with an optional `--no-fail` flag, which will not fail the command if there are any linting errors.

`lint` will read through all resources and find potential errors and warnings in the translation strings, for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules), it searches for **missing messages**, **missing references** and **identical patterns/duplicates**.

However, it's totally up to you how you configure your lints. _You can build your own plugin with your customized set of lints_ with the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/monorepo/tree/main/inlang/source-code/message-lint-rules) as a starter template.

### `open`

The open command opens parts of the Inlang infrastructure in your default browser.

#### `open editor`

The editor command opens the Inlang editor for the current repository.

To open the Inlang editor, run the following command:

```sh
npx @inlang/cli open editor
```

This command retrieves the remote URL of the repository and constructs the URL for the Inlang editor by appending the GitHub user and repository to https://inlang.com/editor/. The editor will be opened in your default browser.

### `module`

The module command is used to interact with the Inlang module. It allows to initialize a new module or run the modules build commands.

#### `module init`

The `module init` command initialize a new Inlang module in the current directory. This works only if the current directory is empty, so make sure to create a new folder.

To initialize a new module, run the following command:

```sh
npx @inlang/cli module init
```

**Options**

The init command has the following options:
`--type <type>`: The type of the module. Currently, `lintRule` or `plugin` is supported.

#### `module build`

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




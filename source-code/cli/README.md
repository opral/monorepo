---
title: "inlang CLI"
href: /documentation/apps/inlang-cli
description: "The inlang CLI"
---

# {% $frontmatter.title %}

[@inlang/cli](https://github.com/inlang/inlang/tree/main/source-code/cli) is a command line interface (CLI) tool that allows you to interact with the Inlang infastructure. It ca be used to automate localization tasks, such as machine translation, linting and more.

### Benefits

- ✨ **Automate** tedious localization tasks
- ⚙️ Integrate localization into your **CI/CD** pipeline
- 🔍 **Lint** your translations
- 🤖 **Machine translate** your resources
- 🖊️ Open web editor right from the command line
- ✅ Validate your `inlang.config.js` configuration file

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
npx inlang [command]
```

If one of the commands can't be found, you are probably using an outdated version of the CLI. You can always get the **latest version** by running `npx inlang@latest [command]`.

## Commands

We recommend to use the CLI with `npx` to avoid installing the CLI globally. Not installing the CLI globally has the following advantages:

- the installed CLI version is scoped to the project, ensuring that it always works.
- the CLI gets installed for team members too, avoiding "why is this command not working for me" questions.

`npx` is auto-installed with Node and NPM.

If one of the commands can't be found, you are probably using an outdated version of the CLI. You can always get the **latest version** by running `npx inlang@latest [command]`.

```sh
CLI for inlang.

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  config [command]   Commands for managing the config file.
  lint               Commands for linting translations.
  machine [command]  Commands for automating translations.
  open [command]     Commands to open parts of the inlang ecosystem.
  help [command]     display help for command
```

The following commands are available with the inlang CLI:

### `config`

The config command is used to interactively configure and create the inlang.config.json file.

#### `config init`

This command scans your file system hierarchy and finds out how your localization files are setup.
It returns a complete config for you to use in your project, which you can modify to your needs.

To use the `config init` command, simply run:

```sh
npx inlang config init
```

This will launch an interactive prompt that will guide you through the process of creating the inlang configuration file.

#### `config validate`

This command validates the `inlang.config.js` file in the current directory. It checks if the file is valid JSON and if it contains **all required fields**. It also checks if the specified resources exist and perform a _dry run of the translation process_.

To validate the `inlang.config.js` file, run the following command:

```sh
npx inlang config validate
```

### `machine`

The machine command is used to automate localization processes.

#### `machine translate`

The translate command machine translates all resources.

To initiate machine translation, run the following command:

```sh
npx inlang machine translate
```

**Options**

The translate command has the following options:

- `-f, --force`: If this option is set, the command will not prompt for confirmation. This is useful for CI/CD build pipelines. **We advise you to only use `machine translate` in build pipelines to avoid out-of-context / wrong translations.**

This command reads the inlang.config.js file in the repository and retrieves the resources and reference language specified in the configuration. It then translates all messages from the reference language to other languages defined in the configuration.

The translations are performed using machine translation services. The translated messages are added to the respective language resources. Finally, the updated resources are written back to the file system.

> Note: The inlang.config.js file must be present in the repository for the translation to work.

### `lint`

The lint command lints the translation with the configured lint rules, for example with the [plugin-standard-lint-rules](https://github.com/inlang/plugin-standard-lint-rules).

```sh
npx inlang lint
```

This command will read through all resources and find potential errors and warnings in the translation strings, for example with the [plugin-standard-lint-rules](https://github.com/inlang/plugin-standard-lint-rules), it searches for **missing messages**, **missing references** and **identical patterns / duplicates**.

However, it's totally up to you how you configure your lints. _You can build your own plugin with your customized set of lints_ with the [plugin-standard-lint-rules](https://github.com/inlang/plugin-standard-lint-rules) as a starter template.

### `open`

The open command opens parts of the Inlang infrastructure in your default browser.

#### `open editor`

The editor command opens the Inlang editor for the current repository.

To open the Inlang editor, run the following command:

```sh
npx inlang open editor
```

This command retrieves the remote URL of the repository and constructs the URL for the Inlang editor by appending the GitHub user and repository to https://inlang.com/editor/. The editor will be opened in your default browser.

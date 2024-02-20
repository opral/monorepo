![inlang CLI header image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/cli/assets/cli-header.jpg)

# Automate (i18n) localization tasks with the CLI

[@inlang/cli](https://github.com/opral/monorepo/tree/main/inlang/source-code/cli) is a command line interface (CLI) tool that allows you to interact with the Inlang infrastructure. It can be used to automate localization tasks, such as machine translation, linting, and more.

Get started with the CLI by using the following npx command:

```bash
npx @inlang/cli [command]
```

See all available commands [here](#commands).

# Let's get started

1. Add a `project.inlang` folder to your repository
2. Create a `settings.json` file to that new dir `project.inlang/settings.json`
3. Install a plugin that reads and writes your messages from the [inlang marketplace](https://inlang.com/c/plugins)
---
4. **Optional** Install lint rules to find errors in your translations from the [inlang marketplace](https://inlang.com/c/lint-rules)


# Core features

<doc-features>
  <doc-feature text-color="#fff" color="#000" title="Automation" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/cli/assets/automation.jpg"></doc-feature>
  <doc-feature text-color="#fff" color="#000" title="Machine Translation" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/cli/assets/machine-translation.jpg"></doc-feature>
  <doc-feature text-color="#fff" color="#000" title="Validation" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/cli/assets/lint.jpg"></doc-feature>
</doc-features>

<br />

<!-- ### Benefits

- ✨ **Automate** tedious localization tasks
- ⚙️ Integrate localization into your **CI/CD** pipeline
- 🔍 **Lint** your translations
- 🤖 **Machine translate** your resources
- 🖊️ Open the web editor right from the command line
- ✅ Validate your inlang project -->

#### Automate

You can use the CLI to automate localization tasks like machine translation, linting, and more.

#### Machine Translation

The CLI allows you to machine translate your resources. This is useful if you want to get a first draft of your translations and then have them reviewed by a human translator. Via machine translation, you can do translation automation e.g. in your CI/CD pipeline.

#### Validation

The CLI allows you to validate your inlang project. This is useful if you want to make sure that your configuration file is valid before you commit it to your repository.

![Example of a dev doing translation automation](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/cli/assets/why.jpg)

# Installation

## Install with package manager

You can install the [@inlang/cli](https://www.npmjs.com/package/@inlang/cli) with this command:

```sh
npm install -D @inlang/cli
```

or

```sh
yarn add --dev @inlang/cli
```

best

```sh
npx @inlang/cli [command]
```

## Minimum requirements

Minimum node version: `v18.0.0`

If one of the commands can't be found, you probably use an outdated CLI version. You can always get the **latest version** by running `npx @inlang/cli@latest [command]`.


# Commands

| Name            | Command                                               | Description                                                                                                  |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **CLI Version** | `npx @inlang/cli@latest [command]`                   | Get the latest version of the inlang CLI.                                                                     |
| **Validate**     | `npx @inlang/cli validate [options]`                  | Validate if the project is working correctly.                          |
| **Lint**        | `npx @inlang/cli lint [options]`                     | Lint translations using configured rules. Options include `--no-fail`, `--project`, and `--languageTags`.      |
| **Machine**     | `npx @inlang/cli machine translate [options]`        | Automate translation processes. Options include `-f, --force`, `--project <path>`, `--sourceLanguageTag <source>` and `--targetLanguageTags <targets...>`                          |
| **Open**        | `npx @inlang/cli open editor`                     | Open parts of the Inlang infrastructure in your default browser, including the [editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor).                        |
| **Module**      | `npx @inlang/cli module [command]`                   | Interact with Inlang modules, including initialization and building. Commands:  `init [options]`   Initialize a new inlang module codebase,   `build [options]`  build an inlang module. Options include `--type`, `--entry`, and `--outdir`. |

---

# Usage

We recommend using the CLI with `npx` to avoid installing the CLI globally. Not installing the CLI globally has the following advantages:

- the installed CLI version is scoped to the project, ensuring it always works.
- the CLI gets installed for team members, avoiding "why is this command not working for me" questions.

`npx` is auto-installed with Node and NPM.

If one of the commands can't be found, you probably use an outdated CLI version. You can always get the **latest version** by running `npx @inlang/cli@latest [command]`.

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
- `--sourceLanguageTag <source>`: Specifies the source [language tag](/m/8y8sxj09/library-inlang-languageTag). 
- `--targetLanguageTags <targets...>`: Specifies the target language tags as comma seperated list (e.g. sk,zh,pt-BR).

The translations are performed using machine translation services. The translated messages are added to the respective language resources. Finally, the updated resources are written back to the file system.

## `validate`

Validates a project.

```sh
npx @inlang/cli validate --project ./path/to/{project-name}.inlang
```

**Options**

The validate command has the following options:

- `--project <path>`: Specifies the path to the project root. The default project root is the current working directory.

This will launch an interactive prompt that will guide you through the process of migrating the inlang configuration file.

## `lint`

The lint command lints the translation with the configured [lint rules](https://inlang.com/c/lint-rules), for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/opral/monorepo/tree/main/inlang/source-code/message-lint-rules).

```sh
npx @inlang/cli lint
```

**Options**

The translate command has the following options:

- `--no-fail`: If this option is set, the command will not fail if there are any linting errors.
- `--project <path>`: Specifies the path to the project root. The default project root is the current working directory.
- `--languageTags <tags>`: Specifies the [language tags](/m/8y8sxj09/library-inlang-languageTag) to lint. Defaults to all. Should be a comma-separated list of language tags specified in the inlang project, e.g. `en,de,fr`.

`lint` will read through all resources and find potential errors and warnings in the translation strings, for example, with the [@inlang/plugin-standard-lint-rules](https://github.com/opral/monorepo/tree/main/inlang/source-code/message-lint-rules), it searches for **missing messages**, **missing references** and **identical patterns/duplicates**.

However, it's totally up to you how you configure your lints. _You can build your own plugin with your customized set of lints_ with the [@inlang/plugin-standard-lint-rules](https://github.com/opral/monorepo/tree/main/inlang/source-code/message-lint-rules) as a starter template.

## `open`

The open command opens parts of the Inlang infrastructure in your default browser.

### `open editor`

The editor command opens the Inlang editor for the current repository.

To open the Inlang editor, run the following command:

```sh
npx @inlang/cli open editor
```

This command retrieves the remote URL of the repository and constructs the URL for the Inlang editor by appending the GitHub user and repository to https://fink.inlang.com/. The editor will be opened in your default browser.

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
`--type <type>`: The module type. Currently, `lintRule` or `plugin` is supported.

### `module build`

If you are developing an inlang module, the `module build` command builds your Inlang module for development & in production.

To build a module, run the following command:

```sh
npx @inlang/cli module build --entry ./path/to/index.ts --outdir ./path/to/dist
```

**Options**

`--entry <entry>`: Specifies the path to the module's entry point, typically src/index.js or src/index.ts.
`--outdir <path>`: Specifies the output directory for the build files. The default output directory is "./dist."
`--watch`: An optional flag that, when provided, enables a watch mode to monitor for changes and automatically rebuild the module when changes are detected.

See how there is also a `--watch` flag, which enables a watch mode to monitor for changes and automatically rebuild the module when changes are detected. This command runs with `esbuild` under the hood. -->

## Troubleshoot

If something isn't working as expected or you are getting errors, make sure to run on the latest version of the CLI. 
You can always get the latest version by executing `npx @inlang/cli@latest`.

If the error persists, [please create an issue](https://github.com/opral/monorepo/issues/new/choose) – we're happy to help.

# Pricing 

<doc-pricing heading="The core features are free for all users." content="While we may introduce enterprise features with associated costs due to API integrations, these enhancements are designed to meet the needs of larger companies. Our commitment remains to provide essential tools for developers, empowering them to address the challenges of international expansion for free."></doc-pricing>


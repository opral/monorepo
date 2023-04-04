---
title: "CLI"
href: /documentation/cli
description: "The Inlang CLI"
---

# {% $frontmatter.title %}

[@inlang/cli](https://github.com/inlang/inlang/tree/main/source-code/cli) is a command line interface (CLI) tool that allows you to interact with the Inlang platform, a cloud-based translation management system that helps you manage your translations efficiently.

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

The config command is used to interactively configure and create the inlang.config.json file.

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

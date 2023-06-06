---
title: Web Editor
href: /documentation/apps/editor
description: This is the editor description
---

# {% $frontmatter.title %}

The inlang web editor is a simple and easy to use nocode tool to manage your translations. It let's translators work on translations without having to touch the code and pushes changes directly to your git repository.

### Benefits

- Works with existing translation files
- Manage translations in a simple web interface
- Use common git workflows
- Git based authentication

## Setup

You can use the editor with any git repository. The only requirement is that you have a `inlang.config.js` file in the root of your repository. This file contains the configuration for the editor.

Required:
A plugin to read and write your translation files. To find the correct plugin for your project, check out the [plugin registry](/documentation/plugins/registry).

Recommended:
A plugin to enable linting feature for your translation files. For example, you can use the [plugin-standard-lint-rules](https://github.com/inlang/plugin-standard-lint-rules) plugin.

## How to use

1. Go to the [Editor](https://inlang.com/editor)
2. Paste your repository URL
3. Login in with your GitHub account
4. Fork the repository
5. Make translations
6. Push changes to your forked repository
7. Create a pull request

**Note:** If you have write access, you can skip the forking step and push directly to the repository.

## Features

**Machine translation**

**Linting**

**Filter languages & search**

**Add new languages**

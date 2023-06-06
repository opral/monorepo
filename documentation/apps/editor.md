---
title: Web Editor
href: /documentation/apps/editor
description: This is the editor description
---

# {% $frontmatter.title %}

The inlang web editor is a simple and easy to use no-code tool to manage your translations. It let's translators work on translations without having to touch the code and pushes changes directly to your git repository.

### Benefits

- works with existing translation files
- git workflows like pull requests
- no hosting, no sync pipelines
- no extra accounts

## Setup

You can use the editor with any git repository. The only requirement is that you have a `inlang.config.js` file in the root of your repository. To get started, follow the steps in the [quick start guide](/documentation/quick-start).

**Required:**
A plugin to read and write your translation files. To find the correct plugin for your project, check out the [plugin registry](/documentation/plugins/registry).

**Recommended:**
A plugin to enable linting feature for your translation files. For example, you can use the [standard-lint-rules](https://github.com/inlang/plugin-standard-lint-rules) plugin.

{% QuickLinks %}

    {% QuickLink
        title="Setup your config now"
        icon="fast"
        href="/documentation/quick-start"
        description="Setup inlang for a localized project."
    /%}

{% /QuickLinks %}

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

**Placeholder**

{% Feedback /%}

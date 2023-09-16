---
title: Project
href: /documentation/project
description: TODO TODO TODO TODO TODO
---

# {% $frontmatter.title %}

An inlang project is defined by a file that is named `project.inlang.json`. The file contains the settings for a project and is the entrypoint for all applications, plugins, and tools in the inlang ecosystem.

Visit the [getting started](/documentation/manually-create-project) page to learn how to create a new project.

![inlang project](https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/documentation/assets/project.jpg)

## Project configuration file schema

The `project.inlang.json` file must contain the following JSON:

```ts
{
  // the "source" language tag that is used in your project
  "sourceLanguageTag": string,
  // all the language tags you want to support in your project
  "languageTags": Array<string>,
  // the modules that are used in the project
  "modules": Array<string>,
}
```

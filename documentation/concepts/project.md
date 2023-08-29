---
title: Project
href: /documentation/concepts/project
description: TODO TODO TODO TODO TODO
---

# {% $frontmatter.title %}

An inlang project is defined by file that is named `project.inlang.json`. It contains the configuration for a project and is the entrypoint for all applications, plugins, and tools in the inlang ecosystem. 

Visit the [getting started](/documentation/getting-started) page to learn how to create a new project.


<!-- TODO fix old name in illustration `inlang.config.js` to `project.inlang.json`  -->
{% Figure
  src="https://github.com/inlang/inlang/assets/58360188/55c61841-ab73-4fa8-a828-3c2016ced872"
  alt="A `project.inlang.json` file configures every app, plugins, and tool in the inlang ecosystem."
  caption="A `project.inlang.json` file configures every app, plugins, and tool in the inlang ecosystem."
/%}

## Project configuration file schema

The `project.inlang.json` file must contain the following JSON:

```ts
{
  // the "source" language tag that is used in your project  
  "sourceLanguageTag": string,
  // all the language tags you want to support in your project
  "languageTags": Array<string>,
  // the packages that are used in the project
  "packages": Array<string>,
  // settings for the project and package items
  "settings": {}
}
```
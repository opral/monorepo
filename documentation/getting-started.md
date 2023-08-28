---
title: Getting started
href: /documentation/getting-started
description: Inlang is globalization infrastructure that powers an ecosystem of apps, plugins, and solutions that make globalization simple.
---

# {% $frontmatter.title %}

This getting started section takes you through the process of creating a new [inlang project](/documentation/concepts/project). 

### 1. Create a project file

#### Using the CLI (recommended)

The easiest way to create a new project is to use the CLI. The CLI will guide you through the process of creating a new project. Be aware that Node.js must be installed on your machine.

```bash
npx @inlang/cli project init
```

#### Manually create a project file 

Alternatively, you can create a new project file manually. Create a new file in the root of your project and name it `project.inlang.json`. The file must contain the following JSON:

```json
{
  // the "source" language tag that is used in your project  
  "sourceLanguageTag": "en",
  // all the language tags you want to support in your project
  "languageTags": ["en", "de"],
  "modules": [],
  "settings": {}
}
```

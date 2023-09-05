---
title: Manually creating a new project
href: /documentation/manually-create-project
description: You can manually create a new project if inlang.com/new is not working for you.
---

# {% $frontmatter.title %}

In case that [inlang.com/new](https://inlang.com/new) does not work for you ([please let us know!](https://github.com/inlang/inlang/discussions/categories/feedback)), you can manually create a new project via the CLI or by creating an inlang project file.

## Using the CLI (recommended)

The easiest way to create a new project is to use the CLI. The CLI will guide you through the process of creating a new project. Be aware that Node.js must be installed on your machine.

```bash
npx @inlang/cli project init
```

## Manually create a project file

Alternatively, you can create a new project file manually.

1. Create a new file in the root of your repository and name it `project.inlang.json`. The file must contain the following JSON:

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/project-config-schema",
	// the "source" language tag that is used in your project
	"sourceLanguageTag": "en",
	// all the language tags you want to support in your project
	"languageTags": ["en", "de"],
	"packages": [],
	"settings": {}
}
```

2. Head to the [marketplace](/marketplace) to find apps and plugins that fits your needs. You can also create your own [app](/documentation/plugins/registry) or [plugin](TODO) if you want to customize inlang to fit your needs.

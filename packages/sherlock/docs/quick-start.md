# Quick start

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-start.png"/>

Install the extension and click `Getting Started` in the `Sherlock Tab`.

> You need a git repository to use the Sherlock extension, as it leverages git functionality (the inlang ecosystem is built on git).

## Manual setup

### 1. Create a `project.inlang/settings.json` in the **root** of your project

You can use the following template when using JSON files as translation files. If not, please look for other [supported resource file types](https://inlang.com/):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/schema/project-settings",
	// the "source" language tag that is used in your project
	"baseLocale": "en",
	// all the language tags you want to support in your project
	"locales": ["en", "de"],
	"modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"], // or use another storage module: https://inlang.com/c/plugins (i18next, json, inlang message format)
	"settings": {}
}
```

### 2. Decide on a **syntax matcher**

You should continue with **installing a syntax matcher**. There are multiple syntax matcher available:

- m function matcher: https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher
- t function matcher: https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher
- _if you are using the i18next module, everything is already built-in_
- _if you are using next-intl, you need https://inlang.com/m/193hsyds/plugin-inlang-nextIntl_

> You might need another module if you are using a different resource file type. You can find all available modules [here](https://inlang.com/c/plugins).

### 3. ✨ Recommended

If you want to add lint rules to your experience, you can add them from https://inlang.com/c/lint-rules

### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide an id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/opral/inlang/issues/new/choose). We are happy to help!

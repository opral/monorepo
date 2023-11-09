<p align="center">
  <a href="https://github.com/inlang/monorepo">  </a>

  <img src="https://github.com/inlang/monorepo/blob/main/inlang/assets/logo_rounded.png?raw=true" alt="inlang icon" width="120px">
  
  <h2 align="center">
    Effortless globalization (i18n, l10n) for your app
  </h2>
  
  <p align="center">powered by <a href="https://github.com/inlang/monorepo/tree/main/lix" target="_blank">lix</p>

  <p align="center">
    <br>
    <a href='https://inlang.com/c/application' target="_blank">🧩 Extensions</a>
    ·
    <a href='https://inlang.com/documentation' target="_blank">📄 Docs</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💙 Discord</a>
    ·
    <a href='https://twitter.com/inlangHQ' target="_blank">🐦 Twitter</a>
    ·
    <a href='https://github.com/orgs/inlang/projects/39' target="_blank">🗺️ Roadmap</a>
  </p>
</p>

<br>

<!-- BODY -->

## Table of Contents

- [About inlang](#-about-inlang)
- [Getting Started](#%EF%B8%8F-getting-started)
- [Stay up-to-date](#-stay-up-to-date)
- [Contributing](#-contributing)

## 🌐 About inlang

**inlang is a whole ecosystem** of building blocks for your globalization (internationalization / i18n) efforts with the goal of helping companies to enter new markets in no time. For example:

- use [inlang paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) to have a fully translated, typesafe & fast app in minutes
- use the [inlang CLI](https://inlang.com/m/2qj2w8pu/app-inlang-cli) to lint your messsages with lint rules or machine translate them & have quality control in CI/CD
- use the [inlang VSCode extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) to translate your app right in the editor
- use the [inlang Web Edtior](https://inlang.com/m/tdozzpar/app-inlang-editor) to translate your app in the browser & invite collaborators to help you
- *build your own app / plugin / lint rule* with the [inlang SDK](https://inlang.com/documentation/architecture)
- ...

**Go to [inlang.com](https://inlang.com) to see all extensions to the inlang ecosystem.**

## ⚡️ Getting Started

It's fairly easy, you need two things to use inlang with any project:

1. A `project.inlang.json` file in the root of your project
2. A plugin that reads and writes the messages from and to your project, we currently support [i18next](https://inlang.com/m/3i8bor92/plugin-inlang-i18next), [plain json](https://inlang.com/m/ig84ng0o/plugin-inlang-json) or [inlang message format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).
3. 🏁 Done!
4. *Optional: Setup lint rules, machine translation, ...*

Example `project.inlang.json`
```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de", "it"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"
	],
	"plugin.inlang.json": {
		"pathPattern": "./resources/{languageTag}.json"
	}
}
```

**More specific guides:**

- Guide: [How to setup inlang for your project](https://inlang.com/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang#)
- Guide: [Build a Global Svelte App](https://inlang.com/g/2fg8ng94/guide-nilsjacobsen-buildAGlobalSvelteApp)

## 🔔 Stay up-to-date

We are permantently working on new features and improvements. If you want to stay up-to-date, you can follow us on [Twitter](https://twitter.com/inlangHQ) or join our [Discord](https://discord.gg/gdMPPWy57R) server. 

We also regularly send out a newsletter with updates and tips & tricks. You can subscribe to it [here](https://inlang.com/newsletter).


## ✍️ Contributing

There are many ways you can contribute to inlang! Here are a few options:

- Star this repo
- Create issues every time you feel something is missing or goes wrong
- Upvote issues with 👍 reaction so we know what's the demand for a particular issue to prioritize it within the roadmap

If you would like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/inlang/monorepo/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

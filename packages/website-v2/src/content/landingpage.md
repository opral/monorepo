## What is Inlang?

### Standard open file format for i18n

Inlang is an _open file format_ for internationalization _i18n_ that provides an [SDK](https://github.com/opral/inlang-sdk) for building and integrating localization tools on top of that open file format.

`.inlang` files are designed to become the open standard for i18n and enable interoperability between i18n solutions. Such solutions involve apps like Fink, libraries like Paraglide JS, or plugins.

#### Core Features

- 📁 File-based: Interoperability without cloud integrations or lock-in.
- 🖊️ CRUD API: Query messages with SQL.
- 🧩 Plugin System: Extend the capabilities with plugins.
- 📦 Import/Export: Import and export messages in different file formats.
- 🎛️ [Lix change control](https://lix.opral.com/): Collaboration, change proposals, reviews, and automation.

![fileformat benefits](https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/src/pages/index/assets/fileformatbenefits.png)

### SDK to build i18n apps & solutions

The inlang SDK is the official specification and parser for `.inlang` files.

The SDK allows creating, reading, and querying inlang files programmatically. Go to the [SDK docs](https://github.com/opral/inlang-sdk) for more information.

![Inlang SDK](https://cdn.jsdelivr.net/gh/opral/inlang/packages/sdk/assets/open-file.svg)

## Stack agnostic

Inlang is a file format with no depedency on a tech stack. Hence, it can be used with any tech stack.

The only thing that is needed are import/export plugins for the translation file format that is used by the tech stack. For iOS for example, the [XCode strings catalog](https://inlang.com/m/neh2d6w7/plugin-hechenbros-xcstrings) can be used. For Flutter a `.arb` plugin would be the right choice.

🧩 [Explore available plugins](https://inlang.com/c/plugins)

![stack agnostic](https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/src/pages/index/assets/tech-stack-icon.svg)

## Ecosystem

Adopting the Inlang format gives you access to an ecosystem of **[apps](https://inlang.com/c/apps), [plugins](https://inlang.com/c/plugins)** that work together seamlessly. Popular tools already built on Inlang include:

- **[ParaglideJS 🪂](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)** – A lightweight i18n library optimized for developer experience.
- **[Fink 🐦](https://fink2.onrender.com/)** – A powerful translation management tool for developers and translators.
- **[Sherlock i18n 🕵️](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)** – A VS Code extension that provides real-time translation linting and suggestions.

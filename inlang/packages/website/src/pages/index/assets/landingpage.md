## What is Inlang?

### Standard open file format for i18n

Inlang is an *open file format* for internationalization *i18n* that provides an [SDK](https://github.com/opral/inlang-sdk) for building and integrating localization tools on top of that open file format.

By defining a standardized file format for i18n, inlang enables interoperability between i18n solutions (translation management apps, developer tools, etc.).

![fileformat benefits](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/src/pages/index/assets/fileformatbenefits.png)

### Stack agnostic

Inlang is a file format with no depedency on a tech stack. Hence, it can be used with any tech stack. 

The only thing that is needed are import/export plugins for the translation file format that is used by the tech stack. For iOS for example, the [XCode strings catalog](https://inlang.com/m/neh2d6w7/plugin-hechenbros-xcstrings) can be used. For Flutter a `.arb` plugin would be the right choice.

[Explore available plugins](https://inlang.com/c/plugins)

![stack agnostic](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/src/pages/index/assets/tech-stack-icon.svg)

### SDK to build i18n apps & solutions

The inlang file format has an SDK that allows you to create, read, and query inlang files programmatically. Go to the [SDK docs](https://github.com/opral/inlang-sdk) for more information.

![Inlang SDK](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/packages/sdk/assets/open-file.svg)

## Ecosystem

Adopting the Inlang format gives you access to an ecosystem of **[apps](https://inlang.com/c/apps), [plugins](https://inlang.com/c/plugins)** that work together seamlessly. Popular tools already built on Inlang include:

- **[ParaglideJS 🪂](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)** – A lightweight i18n library optimized for developer experience.
- **[Fink 🐦](https://fink2.onrender.com/)** – A powerful translation management tool for developers and translators.
- **[Sherlock i18n 🕵️](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)** – A VS Code extension that provides real-time translation linting and suggestions.


<p align="center">
  <a href="https://github.com/opral/monorepo">  </a>

  <img src="https://github.com/opral/monorepo/blob/main/inlang/assets/logo_rounded.png?raw=true" alt="inlang icon" width="90px">
  
  <h2 align="center">
    The open file format and ecosystem for localization (i18n)
  </h2>

  <p align="center">
    <br>
    <a href='https://inlang.com/c/apps' target="_blank">🕹️ Apps</a>
    ·
    <a href='https://inlang.com/documentation' target="_blank">📄 Docs</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💙 Discord</a>
    ·
    <a href='https://twitter.com/inlangHQ' target="_blank">𝕏 Twitter</a>
  </p>
</p>

<br>

## The problem

i18n tools are not interoperable.

```
┌──────────┐        ┌───────────┐         ┌──────────┐
│ i18n lib │───✗────│Translation│────✗────│  Design  │
│          │        │   Tool    │         │   Tool   │
└──────────┘        └───────────┘         └──────────┘
```

Every tool has its own format, its own sync, its own collaboration layer. Cross-team work? Manual exports and hand-offs.

## The solution

An open file format. Everything interoperates.

```
┌──────────┐        ┌───────────┐         ┌──────────┐
│ Paraglide│        │   Fink    │         │ Sherlock │
└────┬─────┘        └─────┬─────┘         └─────┬────┘
     │                    │                     │
     └─────────┐          │          ┌──────────┘
               ▼          ▼          ▼
           ┌──────────────────────────────────┐
           │          .inlang file            │
           └──────────────────────────────────┘
```

One file format. Multiple tools. All interoperable. The good old Unix philosophy.

## Popular tools

- [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — i18n library for JS/TS with fully translated, typesafe & fast apps in minutes
- [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) — translation editor in the browser, invite collaborators to help
- [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) — VS Code extension to translate right in your editor
- [Parrot](https://inlang.com/m/gkrpgoir/app-parrot-figmaPlugin) — see translations directly in Figma
- [CLI](https://inlang.com/m/2qj2w8pu/app-inlang-cli) — lint messages, machine translate, quality control in CI/CD

## Build your own

```ts
import { loadProjectFromDirectory } from "@inlang/sdk";

const project = await loadProjectFromDirectory({
  path: "./project.inlang",
});

const messages = await project.db.selectFrom("message").selectAll().execute();
```

The SDK gives you:

- CRUD API for translations
- SQL queries
- Plugin system for any format
- Version control via lix

[Read the docs →](https://inlang.com/documentation)

## Contributing

There are many ways you can contribute to inlang! Here are a few options:

- Star this repo
- Create issues every time you feel something is missing or goes wrong
- Upvote issues with 👍 reaction so we know what the demand for a particular issue to prioritize it within the roadmap

If you would like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/opral/monorepo/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

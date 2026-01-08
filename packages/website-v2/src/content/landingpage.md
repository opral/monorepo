## The problem

i18n tools are not interoperable.

No common file format for i18n tools exists. Data formats like JSON or YAML are unsuited for complex tools that need CRUD APIs, need to scale to hundreds of thousands of messages, or require version control.

The result is fragmented tooling:

- Switching tools requires migrations and refactoring
- Cross-team work requires manual exports and hand-offs
- Automating workflows requires custom scripts and glue code

```
┌──────────┐        ┌───────────┐         ┌──────────┐
│ i18n lib │───✗────│Translation│────✗────│   CI/CD  │
│          │        │   Tool    │         │Automation│
└──────────┘        └───────────┘         └──────────┘
```

## The solution

Inlang is a file format designed for building i18n tools — enabling interoperability across all i18n tools.

- **CRUD API** — Read and write translations programmatically
- **SQL queries** — Query messages like a database, scale to millions
- **Plugin system** — Import/export any format (JSON, XLIFF, etc.)
- **Version control** — Built-in version control via [lix](https://lix.opral.com)

```
┌──────────┐        ┌───────────┐         ┌────────────┐
│ i18n lib │        │Translation│         │   CI/CD    │
│          │        │   Tool    │         │ Automation │
└────┬─────┘        └─────┬─────┘         └─────┬──────┘
     │                    │                     │
     └─────────┐          │          ┌──────────┘
               ▼          ▼          ▼
           ┌──────────────────────────────────┐
           │          .inlang file            │
           └──────────────────────────────────┘
```

The result:

- Switch tools without migrations — they all use the same file
- Cross-team work without hand-offs — developers, translators, and designers all edit the same source
- Automation just works — one source of truth, no glue code

## Popular tools

- **[Paraglide JS 🪂](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)** – i18n library for JS/TS with full typesafety and tree-shaking
- **[Fink 🐦](https://fink.inlang.com)** – Translation editor in the browser, invite collaborators to help
- **[Sherlock 🕵️](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)** – VS Code extension to translate right in your editor

## Build your own i18n tooling

The inlang SDK is the official specification and parser for `.inlang` files.

Build linters, editors, CLI tools, IDE extensions, or libraries — all interoperable with every other inlang tool.

```ts
import { loadProjectFromDirectory } from "@inlang/sdk";

const project = await loadProjectFromDirectory({
  path: "./project.inlang",
});

const messages = await project.db.selectFrom("message").selectAll().execute();
```

[Read the SDK docs →](https://github.com/opral/inlang)

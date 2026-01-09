# Introduction

## What is inlang?

Inlang is an open file format and SDK for localization (i18n) that enables interoperability between tools. Instead of being locked into one translation management system, inlang provides a universal `.inlang` file format that any tool can read and write.

The SDK consists of two main parts:

- **A file format** that stores translations in a portable SQLite database with built-in version control
- **An API** for loading, querying, and modifying translations programmatically

## Why inlang?

i18n tools are not interoperable. No common file format exists. Data formats like JSON or YAML are unsuited for complex tools that need CRUD APIs, need to scale to hundreds of thousands of messages, or require version control.

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

Inlang follows Unix philosophy: **one file format, multiple tools, all interoperable**.

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

**The result:**

- Switch tools without migrations — they all use the same file
- Cross-team work without hand-offs — developers, translators, and designers all edit the same source
- Automation just works — one source of truth, no glue code

## How it works

An `.inlang` file is a SQLite database with built-in version control via Lix. That's it — one portable file containing all your translations.

```
┌─────────────────┐       ┌─────────┐       ┌──────────────────┐
│  .inlang file   │◄─────►│ Plugins │◄─────►│ Translation files│
│    (SQLite)     │       │         │       │  (JSON, XLIFF)   │
└─────────────────┘       └─────────┘       └──────────────────┘
```

Plugins handle the import/export between your source files (JSON, i18next, XLIFF, etc.) and the inlang database. You can keep your existing file structure — plugins sync changes bidirectionally.

To store an inlang project in git, you can use the **unpacked format** — a directory instead of a single file. See [Unpacked Project](/docs/unpacked-project) for details.

## Next steps

- [Getting Started](/docs/getting-started) — Set up your first project
- [Architecture](/docs/architecture) — Understand the three layers
- [Writing a Tool](/docs/write-tool) — Build a tool that queries translations
- [Writing a Plugin](/docs/write-plugin) — Support a custom file format

## Credits

Inlang builds on [Lix](https://lix.opral.com) for version control and [Kysely](https://kysely.dev) for the query API.


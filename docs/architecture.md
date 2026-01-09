# Architecture

Inlang's architecture has three layers: storage, data model, and plugins.

```
┌─────────────────────────────────────────────┐
│  Storage (SQLite + Lix)                     │
├─────────────────────────────────────────────┤
│  Data Model (Bundle, Message, Variant)      │
├─────────────────────────────────────────────┤
│  Plugins (JSON, i18next, XLIFF, etc.)       │
└─────────────────────────────────────────────┘
```

## Storage

An `.inlang` file is a SQLite database with built-in version control via [Lix](https://lix.opral.com). One portable file containing all your translations, settings, and change history.

SQLite was chosen because:

- **Queryable** — Filter, join, and aggregate translations with SQL
- **Portable** — Single file, no server, works in browser via WASM
- **Proven** — Battle-tested, used everywhere

## Data Model

Translations are stored in three tables: **Bundle**, **Message**, and **Variant**.

```
Bundle (greeting)
├── Message (en)
│   └── Variant ("Hello {name}!")
├── Message (de)
│   └── Variant ("Hallo {name}!")
└── Message (fr)
    └── Variant ("Bonjour {name}!")
```

- **Bundle** — Groups translations by key. One bundle = one translatable unit across all locales.
- **Message** — A locale-specific translation. One message per locale per bundle.
- **Variant** — The actual text pattern. Supports plurals and conditional matching.

See [Data Model](/docs/data-model) for details.

## Plugins

Plugins handle the transformation between external file formats (JSON, i18next, XLIFF) and inlang's internal data model.

```
┌─────────────────┐       ┌─────────┐       ┌──────────────────┐
│  .inlang file   │◄─────►│ Plugins │◄─────►│ Translation files│
│    (SQLite)     │       │         │       │  (JSON, XLIFF)   │
└─────────────────┘       └─────────┘       └──────────────────┘
```

Plugins only do import/export — they don't touch the database directly. This keeps the core simple and makes format support extensible.

See [Plugin API](/docs/plugin-api) for the reference or [Writing a Plugin](/docs/write-plugin) to build your own.

## Message-first design

Traditional i18n tools are file-first: you load `en.json`, `de.json`, `fr.json` as separate resources and iterate through files to find translations.

Inlang is message-first: you query messages directly from the database.

```typescript
// File-first: load each file, find the key manually
const en = JSON.parse(fs.readFileSync('en.json'));
const de = JSON.parse(fs.readFileSync('de.json'));
const greeting = { en: en.greeting, de: de.greeting };

// Message-first: query what you need
const messages = await project.db
  .selectFrom('message')
  .where('bundleId', '=', 'greeting')
  .selectAll()
  .execute();
```

Why this matters:

- **Tools don't care about files** — They care about messages. Files are an import/export detail.
- **Query across locales** — Find missing translations, compare locales, aggregate stats.
- **Future-proof** — The data model works regardless of where translations come from (files, APIs, databases).

## Next steps

- [CRUD API](/docs/crud-api) — Query and modify translations
- [Writing a Tool](/docs/write-tool) — Build a tool using the SDK
- [Writing a Plugin](/docs/write-plugin) — Support a custom file format


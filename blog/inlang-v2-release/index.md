---
og:title: "inlang v2 release (SQLite, Variants, and a new Foundation)"
og:description: "We rebuilt the inlang SDK on SQLite WASM. Here's what changed and why it matters."
---

# inlang v2 release (SQLite, Variants, and a new Foundation)

Inlang v2 is out. This post covers what changed, why we rebuilt the SDK on SQLite, and how this powers Paraglide JS 2.0.

## Git as a Database Didn't Work

We originally built inlang on git. The idea was that git gives you version control, pull requests, and CI/CD for free. We wrote about this in [our 2022 RFC](/blog/notes-on-git-based-architecture).

Turns out git as a backend has serious problems. We spent over six months trying to build a git-compatible persistency layer for variant support (pluralization, gender, etc). Workaround after workaround.

Git wasn't designed for structured data. We had to parse diffs, handle merge conflicts in JSON, and sync state between the filesystem and the app. We called it the "git workaround trap". Engineering resources went in, nothing came out.

## SQLite WASM

We rebuilt the SDK on SQLite WASM. Not an easy call after years of investment in the git approach. But the benefits were obvious:

1. **Structured data storage**: Messages, bundles, and variants live in proper database tables
2. **Type-safe queries**: Kysely gives us TypeScript safety for all database operations
3. **Web-native**: SQLite WASM runs in browsers without Node.js
4. **Atomic transactions**: No more partial file writes or corrupted state

The schema has three tables:

```
Bundle (id, declarations)
  └── Message (id, bundleId, locale, selectors)
        └── Variant (id, messageId, matches, pattern)
```

This normalized structure is what makes variant support possible.

## Variants

The v1 message format was simple: message ID maps to translations per language. Real-world localization is messier.

The new message AST is inspired by Unicode's [Message Format 2](https://unicode.org/reports/tr35/tr35-messageFormat.html) (MF2). MF2 defines a standard for handling pluralization, gender, and other selection logic in messages. We adopted its core concepts: selectors that match against values, and variants that define the output for each match.

Pluralization:

```
"You have 1 item" vs "You have 5 items"
```

Gendered languages:

```
"He is connected" vs "She is connected" vs "They are connected"
```

In v2, a bundle contains messages (one per locale), and each message can have multiple variants. Selectors determine which variant to display:

```typescript
// A message with plural variants
{
  id: "cart_items",
  locale: "en",
  selectors: [{ type: "variable-reference", name: "count" }],
  variants: [
    { matches: [{ type: "literal-match", key: "count", value: "one" }],
      pattern: [{ type: "text", value: "You have 1 item" }] },
    { matches: [{ type: "catchall-match", key: "count" }],
      pattern: [{ type: "text", value: "You have " },
                { type: "expression", arg: { name: "count" } },
                { type: "text", value: " items" }] }
  ]
}
```

Works for pluralization, gender, A/B testing, whatever you need.

## Direct Database Access

We expose the database directly via Kysely instead of building a limited query API:

```typescript
const project = await loadProjectInMemory({ blob });

// Direct SQL queries with full TypeScript safety
const bundles = await project.db
  .selectFrom("bundle")
  .innerJoin("message", "message.bundleId", "bundle.id")
  .innerJoin("variant", "variant.messageId", "message.id")
  .where("message.locale", "=", "en")
  .selectAll()
  .execute();
```

Need to find bundles missing a German translation? Write a query. Building a custom lint rule? Query the database. Less API surface, more flexibility.

## Import/Export

Translation files come in many formats: JSON, YAML, XLIFF, gettext, proprietary stuff. The SDK doesn't know about any of them. Plugins handle it.

```typescript
type Plugin = {
  key: string;
  toBeImportedFiles: ({ settings }) => Array<{ path, locale }>;
  importFiles: ({ files, settings }) => { bundles, messages, variants };
  exportFiles: ({ bundles, messages, variants, settings }) => Array<{ path, content }>;
};
```

The SDK passes files to plugins, plugins return structured data, SDK stores it in SQLite. Export reverses the process.

This keeps filesystem operations out of the SDK core. Web apps import via UI upload. Node.js apps use the filesystem. The plugin handles format-specific logic.

## Built on Lix

Inlang v2 runs on [Lix](https://lix.dev), our version control system for structured data. Git tracks line-based changes in text files. Lix tracks changes in any format, including SQLite databases.

Translation projects get:

- Change tracking at the variant level
- Branches and merging
- CI/CD automation
- Review systems for translation changes

Lix is not a git wrapper. It's a version control system built on SQLite, designed for applications.

## Paraglide JS 2.0

Paraglide JS 2.0 is built on inlang v2. The new architecture made these features possible:

- **Pluralization**: Native variant support powers `plural()`
- **Nested keys**: Bundle/message/variant hierarchy maps to nested structures
- **Any routing strategy**: URL-based, cookie-based, or custom
- **Auto-imports**: `m.` triggers IDE completions
- **Arbitrary key names**: Including emojis via `m["🍌"]()`
- **Per-locale splitting**: Experimental bundle splitting for smaller payloads
- **Multi-tenancy**: Domain-based routing for SaaS apps

See the [Paraglide JS 2.0 announcement](/blog/paraglide-js-2) for details.

## Migration

The SDK migrates v1 messages to v2 automatically:

- `sourceLanguageTag` becomes `baseLocale`
- `languageTags` becomes `locales`
- Messages convert to bundle/message/variant structure

Old plugins still work. `loadMessages` and `saveMessages` from v1 are supported, with the SDK handling conversion internally.

## What's Next

With a proper database and version control, we can build things that weren't practical before:

- Real-time collaboration on translations
- Change history and rollback at the message level
- Automation pipelines triggered by translation changes
- AI-assisted translation with full context

The "two sources of truth" problem from 2022 is solved. Git repos and translation editors operate on the same data through Lix.

## Try It

```bash
npm install @inlang/sdk
```

For Paraglide JS:

```bash
npm install @inlang/paraglide-js@2
```

See the [documentation](https://inlang.com/documentation) for migration guides.

---

Going from git to SQLite wasn't the original plan. We learned that delaying the right architecture leads to compound problems. The result, a proper database for translations with version control, is what we should have built from day one.

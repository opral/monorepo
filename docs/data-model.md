# Data Model

Translations are stored in three tables: **Bundle**, **Message**, and **Variant**.

The data model is relational (SQL) and heavily inspired by [Unicode MessageFormat 2](https://unicode.org/reports/tr35/tr35-messageFormat.html).

```
Bundle (greeting)
├── Message (en)
│   └── Variant ("Hello {name}!")
├── Message (de)
│   └── Variant ("Hallo {name}!")
└── Message (fr)
    └── Variant ("Bonjour {name}!")
```

## Bundle

A bundle groups translations by key. One bundle = one translatable unit across all locales.

```typescript
type Bundle = {
  id: string;           // e.g., "greeting", "error_404"
  declarations: Declaration[];
}
```

The `id` is your translation key — what you reference in code. The id is assumed to be stable; changing it would break all references. Declarations define variables available to all messages in the bundle.

## Message

A message is a locale-specific translation. One message per locale per bundle.

```typescript
type Message = {
  id: string;           // auto-generated UUID
  bundleId: string;     // references Bundle.id
  locale: string;       // e.g., "en", "de", "fr"
  selectors: VariableReference[];
}
```

Selectors are used for conditional matching (plurals, gender, etc.). If your message has no conditions, selectors is empty.

## Variant

A variant is the actual text pattern. Most messages have one variant, but pluralization requires multiple.

```typescript
type Variant = {
  id: string;           // auto-generated UUID
  messageId: string;    // references Message.id
  matches: Match[];     // conditions for this variant
  pattern: Pattern;     // the text content
}
```

### Simple example

A greeting with no pluralization:

```
Bundle: "greeting"
└── Message: locale="en"
    └── Variant: pattern="Hello {name}!"
└── Message: locale="de"
    └── Variant: pattern="Hallo {name}!"
```

### Pluralization example

A message with plural forms needs multiple variants:

```
Bundle: "items_count"
  declarations: [{ type: "input-variable", name: "count" }]
└── Message: locale="en", selectors=["count"]
    └── Variant: matches=[{key: "count", value: "one"}], pattern="One item"
    └── Variant: matches=[{key: "count", value: "other"}], pattern="{count} items"
└── Message: locale="de", selectors=["count"]
    └── Variant: matches=[{key: "count", value: "one"}], pattern="Ein Artikel"
    └── Variant: matches=[{key: "count", value: "other"}], pattern="{count} Artikel"
```

## Pattern syntax

Patterns contain text and expressions (variables):

- **Text** — Plain strings: `"Hello world"`
- **Expression** — Variables wrapped in braces: `"Hello {name}!"`

Expressions can have annotations for formatting:

```
{count}              // plain variable
{count: number}      // format as number
{date: date}         // format as date
{count: plural}      // pluralization
```

## Querying the data model

Use Kysely to query messages:

```typescript
// Get all messages for a bundle
const messages = await project.db
  .selectFrom("message")
  .where("bundleId", "=", "greeting")
  .selectAll()
  .execute();

// Get all bundles with their messages
const bundles = await project.db
  .selectFrom("bundle")
  .leftJoin("message", "message.bundleId", "bundle.id")
  .selectAll()
  .execute();

// Find missing translations
const missing = await project.db
  .selectFrom("bundle")
  .where((eb) =>
    eb.not(
      eb.exists(
        eb.selectFrom("message")
          .where("message.bundleId", "=", eb.ref("bundle.id"))
          .where("message.locale", "=", "de")
      )
    )
  )
  .selectAll()
  .execute();
```

## Next steps

- [CRUD API](/docs/crud-api) — Full reference for query operations
- [Architecture](/docs/architecture) — See how the data model fits in
- [Writing a Tool](/docs/write-tool) — Build a tool that queries messages
- [Plugin API](/docs/plugin-api) — Import types for plugins


# CRUD API

The CRUD API is what makes building i18n tools easy. Instead of parsing and writing translation files in different formats (JSON, XLIFF, YAML, etc.), you query and modify messages directly. Plugins handle the file format conversion at the boundary.

Inlang uses [Kysely](https://kysely.dev) for type-safe database queries. Access it via `project.db`.

```typescript
import { loadProjectFromDirectory } from "@inlang/sdk";

const project = await loadProjectFromDirectory({
  path: "./project.inlang",
  fs: fs,
});

// project.db is a Kysely instance
const bundles = await project.db
  .selectFrom("bundle")
  .selectAll()
  .execute();
```

## Create

### Insert a bundle

```typescript
await project.db
  .insertInto("bundle")
  .values({
    id: "greeting",
    declarations: []
  })
  .execute();
```

### Insert a message

```typescript
await project.db
  .insertInto("message")
  .values({
    id: crypto.randomUUID(),
    bundleId: "greeting",
    locale: "en",
    selectors: []
  })
  .execute();
```

### Insert a variant

```typescript
await project.db
  .insertInto("variant")
  .values({
    id: crypto.randomUUID(),
    messageId: messageId,
    matches: [],
    pattern: [{ type: "text", value: "Hello world!" }]
  })
  .execute();
```

### Insert nested (bundle + messages + variants)

```typescript
import { insertBundleNested } from "@inlang/sdk";

await insertBundleNested(project.db, {
  id: "greeting",
  declarations: [],
  messages: [
    {
      id: crypto.randomUUID(),
      bundleId: "greeting",
      locale: "en",
      selectors: [],
      variants: [
        {
          id: crypto.randomUUID(),
          messageId: messageId,
          matches: [],
          pattern: [{ type: "text", value: "Hello!" }]
        }
      ]
    }
  ]
});
```

## Read

### Get all bundles

```typescript
const bundles = await project.db
  .selectFrom("bundle")
  .selectAll()
  .execute();
```

### Get bundle by ID

```typescript
const bundle = await project.db
  .selectFrom("bundle")
  .selectAll()
  .where("id", "=", "greeting")
  .executeTakeFirst();
```

### Get messages by locale

```typescript
const messages = await project.db
  .selectFrom("message")
  .selectAll()
  .where("locale", "=", "en")
  .execute();
```

### Get messages for a bundle

```typescript
const messages = await project.db
  .selectFrom("message")
  .selectAll()
  .where("bundleId", "=", "greeting")
  .execute();
```

### Get variants for a message

```typescript
const variants = await project.db
  .selectFrom("variant")
  .selectAll()
  .where("messageId", "=", messageId)
  .execute();
```

### Get nested (bundle with messages and variants)

```typescript
import { selectBundleNested } from "@inlang/sdk";

const bundle = await selectBundleNested(project.db)
  .where("bundle.id", "=", "greeting")
  .executeTakeFirst();

// Returns:
// {
//   id: "greeting",
//   declarations: [],
//   messages: [
//     {
//       id: "...",
//       locale: "en",
//       variants: [{ id: "...", pattern: [...] }]
//     }
//   ]
// }
```

### Join bundles and messages

```typescript
const results = await project.db
  .selectFrom("bundle")
  .leftJoin("message", "message.bundleId", "bundle.id")
  .selectAll()
  .execute();
```

### Find missing translations

```typescript
const missingGerman = await project.db
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

## Update

### Update a bundle

```typescript
await project.db
  .updateTable("bundle")
  .set({
    declarations: [{ type: "input-variable", name: "count" }]
  })
  .where("id", "=", "greeting")
  .execute();
```

### Update a variant's text

```typescript
await project.db
  .updateTable("variant")
  .set({
    pattern: [{ type: "text", value: "Updated text" }]
  })
  .where("id", "=", variantId)
  .execute();
```

### Update nested

```typescript
import { updateBundleNested } from "@inlang/sdk";

await updateBundleNested(project.db, {
  id: "greeting",
  declarations: [],
  messages: [
    {
      id: messageId,
      locale: "en",
      selectors: [],
      variants: [
        {
          id: variantId,
          matches: [],
          pattern: [{ type: "text", value: "Updated!" }]
        }
      ]
    }
  ]
});
```

## Delete

### Delete a bundle

```typescript
await project.db
  .deleteFrom("bundle")
  .where("id", "=", "greeting")
  .execute();

// Cascades: all messages and variants are deleted
```

### Delete a message

```typescript
await project.db
  .deleteFrom("message")
  .where("id", "=", messageId)
  .execute();

// Cascades: all variants are deleted
```

### Delete a variant

```typescript
await project.db
  .deleteFrom("variant")
  .where("id", "=", variantId)
  .execute();
```

## Upsert

Insert or update based on whether the record exists.

### Upsert a bundle

```typescript
await project.db
  .insertInto("bundle")
  .values({
    id: "greeting",
    declarations: []
  })
  .onConflict((oc) =>
    oc.column("id").doUpdateSet({
      declarations: []
    })
  )
  .execute();
```

### Upsert nested

```typescript
import { upsertBundleNested } from "@inlang/sdk";

await upsertBundleNested(project.db, {
  id: "greeting",
  declarations: [],
  messages: [...]
});
```

## Next steps

- [Data Model](/docs/data-model) — Understand bundles, messages, and variants
- [Writing a Tool](/docs/write-tool) — Build a complete tool using CRUD operations
- [Unpacked Project](/docs/unpacked-project) — Load projects from disk


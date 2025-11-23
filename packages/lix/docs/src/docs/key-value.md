# Key-Value Store

Lix has a built-in [entity](/docs/data-model) for key values. Store any JSON value - from feature flags to UI preferences - and access it across your application.


## Common Use Cases

- **UI state persistence** - Sidebar positions, dismissed prompts, user preferences
- **App configuration** - Feature flags, environment settings, runtime toggles
- **Lix configuration** - Lix itself stores key values like `lix_id`, `lix_name`, or `lix_deterministic_mode`

## Basic Usage

```ts
// Insert
await lix.db
  .insertInto("key_value")
  .values({ key: "myapp_theme", value: "dark" })
  .execute();

// Read
const config = await lix.db
  .selectFrom("key_value")
  .where("key", "=", "myapp_theme")
  .executeTakeFirst();

// Update
await lix.db
  .updateTable("key_value")
  .where("key", "=", "myapp_theme")
  .set({ value: "light" })
  .execute();
```

## Tracked vs Untracked

**Tracked (default)** creates commits and appears in history:

```ts
// Feature flag that should be versioned
await lix.db
  .insertInto("key_value")
  .values({ key: "myapp_beta_enabled", value: true })
  .execute();
```

Use for: Feature flags, app configuration, version-specific settings

**Untracked** values don't create commits:

```ts
// UI preference that shouldn't create commits
await lix.db
  .insertInto("key_value")
  .values({
    key: "myapp_sidebar_width",
    value: 240,
    lixcol_untracked: 1
  })
  .execute();
```

Use for: UI preferences, dismissed prompts, window positions, editor state

## Namespacing

Always prefix keys with your app name to avoid collisions:

```ts
// Good
"myapp_theme"
"myapp_sidebar_collapsed"
"myapp_feature_enabled"

// Bad - can conflict with other apps or Lix internals
"theme"
"enabled"
```

Lix uses the `lix_*` prefix internally (`lix_id`, `lix_name`, `lix_deterministic_mode`). Avoid this prefix.

## Important: Booleans

Booleans are returned as integers because SQLite's `json_extract` function (used by the views) converts JSON booleans to integers:

- `true` → `1`
- `false` → `0`

```ts
// Store boolean
await lix.db
  .insertInto("key_value")
  .values({ key: "foo_enabled", value: true })
  .execute();

// Read and convert
const result = await lix.db
  .selectFrom("key_value")
  .where("key", "=", "foo_enabled")
  .executeTakeFirstOrThrow();

// Option 1: Use loose equality (simplest)
if (result.value == true) {
  /* enabled */
}

// Option 2: Explicit conversion
const isEnabled = result.value === 1;
```

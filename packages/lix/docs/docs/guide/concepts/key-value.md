# Key-Value

A simple key-value store built into Lix with change control. Store any JSON value - from feature flags to UI preferences - and access it across your application.

## Common Use Cases

- **UI state persistence** - Sidebar positions, dismissed prompts, user preferences
- **App configuration** - Feature flags, environment settings, runtime toggles
- **Lix configuration** - Lix itself stores key values like `lix_id`, `lix_name`, or `lix_deterministic_mode`

## Quick Start

Always namespace your keys to avoid collisions:

```ts
// ✅ DO: Use namespaced keys
await lix.db
  .insertInto("key_value")
  .values({ key: "myapp_sidebar_collapsed", value: true })
  .execute();

// Read it back
const sidebar = await lix.db
  .selectFrom("key_value")
  .where("key", "=", "myapp_sidebar_collapsed")
  .executeTakeFirst();
```

## Do's and Don'ts

### ✅ DO

- **Always use namespaces**: `myapp_feature`, `ui_sidebar`, `config_theme`
- **Store UI state as untracked**: Use `lixcol_untracked: 1` for ephemeral data

### ❌ DON'T

- **Never use bare keys**: Avoid `"theme"`, use `"myapp_theme"` instead

## Real-World Examples

### UI State Pattern

```ts
// Store dismissed prompts per file (from md-app)
const key = `flashtype_prompt_dismissed_${activeFileId}`;
await lix.db
  .insertInto("key_value")
  .values({ key, value: true, lixcol_untracked: 1 })
  .execute();
```

### Untracked Preferences

```ts
// UI preferences that don't create commits
await lix.db
  .insertInto("key_value_by_version")
  .values({
    key: "ui_sidebar_width",
    value: 240,
    lixcol_untracked: 1,
    lixcol_version_id: "global",
  })
  .execute();
```

## Views

- **`key_value`** - Active version only. Your default choice.
- **`key_value_by_version`** - All versions. Use for untracked values or cross-version operations.
- **`key_value_history`** - Read-only audit trail.

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

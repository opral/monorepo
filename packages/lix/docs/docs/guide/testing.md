# Writing Tests

This guide is for developers embedding Lix who want confidence in their own code. The workflow stays straightforward: open Lix in memory, call the same APIs you use in production, and assert on the data that comes back. No mocks, no alternate code paths.

**Do's**

- Run Lix in memory with `openLix({})` for fast, isolated tests.
- Exercise your real business logic and SDK calls rather than stubbing layers.

**Dont's**

- Mock out the Lix database or filesystem—use the actual engine instead.
- Persist temporary blobs to disk unless you explicitly need cross-test state.

## The simplest possible test

`openLix({})` boots an isolated SQLite + WASM instance in memory. You can interact with it through the Kysely-based query builder exposed on `lix.db`.

```ts
import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";

test("stores a key-value pair", async () => {
  const lix = await openLix({});

  await lix.db
    .insertInto("key_value")
    .values({ key: "greeting", value: { message: "hello" } })
    .execute();

  const row = await lix.db
    .selectFrom("key_value")
    .selectAll()
    .where("key", "=", "greeting")
    .executeTakeFirstOrThrow();

  expect(row.value).toEqual({ message: "hello" });

});
```

Running this inside Vitest or Jest is enough to simulate an end-to-end flow: the real persistence layer kicks in, triggers fire, and queries go through the production code paths.

## Testing with plugins

When testing applications that use Lix plugins, provide the plugins during initialization to test the complete integration:

```ts
import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin } from "./my-plugin.js";

test("detects changes when inserting a file", async () => {
  // Initialize Lix with your plugin
  const lix = await openLix({
    providePlugins: [plugin],
  });

  // Insert file data - this triggers plugin.detectChanges
  const fileContent = "# Heading\n\nParagraph text";
  await lix.db
    .insertInto("file")
    .values({
      id: "doc",
      path: "/document.md",
      data: new TextEncoder().encode(fileContent),
    })
    .execute();

  // Query the changes detected by your plugin
  const changes = await lix.db
    .selectFrom("change")
    .innerJoin("file", "change.file_id", "file.id")
    .where("file.path", "=", "/document.md")
    .where("plugin_key", "=", plugin.key)
    .selectAll()
    .execute();

  expect(changes.length).toBeGreaterThan(0);
  // Assert on specific plugin behavior...
});
```

This tests the complete plugin lifecycle: file insertion triggers change detection, entities are created, and you can verify the plugin's behavior against real data.

## Deterministic mode for consistent results

For tests that rely on timestamps, random numbers, or UUIDs, enable deterministic mode to ensure consistent results across test runs:

```ts
const lix = await openLix({
  keyValues: [
    {
      key: "lix_deterministic_mode",
      value: { enabled: true },
      lixcol_version_id: "global",
    },
  ],
});
```

See [Deterministic Mode](./deterministic-mode.md) for the complete configuration options including custom seeds and random Lix IDs.

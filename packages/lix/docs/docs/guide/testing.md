# Testing

Testing code that uses Lix is straightforward because you can run a real, in-memory Lix instance in your test environment. This approach avoids mocks and ensures your tests exercise the same code paths that run in production, giving you high confidence in your application's behavior.

## Quick Start

Use `openLix({})` to create a fast, isolated, in-memory Lix instance for each test. Then, interact with it using the same APIs you use in your application.

```ts
import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";

test("should store and retrieve a key-value pair", async () => {
  const lix = await openLix({});

  // Use the same API as your app
  await lix.db
    .insertInto("key_value")
    .values({ key: "greeting", value: { message: "hello" } })
    .execute();

  // Assert on the result
  const row = await lix.db
    .selectFrom("key_value")
    .selectAll()
    .where("key", "=", "greeting")
    .executeTakeFirstOrThrow();

  expect(row.value).toEqual({ message: "hello" });
});
```

## Core Principles

Adhering to a few principles ensures your tests are robust, fast, and easy to maintain.

| Principle               | Why It Matters                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Test the Real Thing** | By using a real Lix instance, you verify the entire stack, from your business logic to the persistence layer. No brittle mocks, no surprises in production.                          |
| **Isolate Tests**       | Each call to `openLix({})` creates a fresh, ephemeral database in memory. This guarantees that tests run in isolation and don't leak state, making them parallelizable and reliable. |
| **Use Production APIs** | Write tests that call your application's functions and services. This ensures you're testing your app's behavior, not just the underlying Lix functionality.                         |

## Common Testing Scenarios

### Testing with Plugins

If your application uses plugins, provide them during initialization to test the complete, integrated behavior.

```ts
import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { myPlugin } from "./my-plugin.js"; // Your plugin

test("should trigger plugin change detection", async () => {
  const lix = await openLix({
    providePlugins: [myPlugin],
  });

  // This action will trigger your plugin's logic
  await lix.db
    .insertInto("file")
    .values({
      id: "doc",
      path: "/document.md",
      data: new TextEncoder().encode("# Hello"),
    })
    .execute();

  // Assert that the plugin produced the expected entities
  const changes = await lix.db
    .selectFrom("change")
    .where("plugin_key", "=", myPlugin.key)
    .selectAll()
    .execute();

  expect(changes.length).toBeGreaterThan(0);
});
```

### Deterministic Mode

For tests involving timestamps, random numbers, or UUIDs, enable deterministic mode. This guarantees your tests produce the same results every time they run.

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

// Now, any Lix-generated IDs or timestamps will be predictable
```

See [Deterministic Mode](./deterministic-mode.md) for more configuration options.

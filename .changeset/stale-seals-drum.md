---
"@lix-js/sdk": minor
---

Introducing a universal logging system. Closes https://github.com/opral/lix-sdk/issues/266

- apps can now create logs
- lix will create logs for internal operations prefixed with `lix.`, e.g. `lix.file_queue.skipped`

```ts
await createLog({
  lix,
  key: "app.init",
  level: "info",
  message: "Application started.",
});
```

Logs can be queried via SQL

```ts
const logs = await lix.db
  .selectFrom("log")
  .selectAll()
  .where("level", "=", "info")
  .where("key", "LIKE", "app.%")
  .execute();
```

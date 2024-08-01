## Usage

```ts
const db = new Kysely<DB>({ dialect: createDialect({
    database: createInMemoryDatabase()
  })
});
```

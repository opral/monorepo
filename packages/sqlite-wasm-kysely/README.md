## Usage

```ts
const db = createInMemoryDatabase();

const kysely = new Kysely<DB>({
  dialect: createDialect({
    database: db,
  }),
});
```

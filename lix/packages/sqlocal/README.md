# SQLocal

SQLocal makes it easy to run SQLite3 in the browser, backed by the origin private file system. It wraps the [WebAssembly build of SQLite3](https://sqlite.org/wasm/doc/trunk/index.md) and gives you a simple interface to interact with databases running on device.

[Documentation](https://sqlocal.dallashoffman.com) - [GitHub](https://github.com/DallasHoff/sqlocal) - [NPM](https://www.npmjs.com/package/sqlocal) - [Fund](https://www.paypal.com/biz/fund?id=U3ZNM2Q26WJY8)

## Features

- 🔎 Locally executes any query that SQLite3 supports
- 🧵 Runs the SQLite engine in a web worker so queries do not block the main thread
- 📂 Persists data to the origin private file system, which is optimized for fast file I/O
- 🔒 Each user can have their own private database instance
- 🚀 Simple API; just name your database and start running SQL queries
- 🛠️ Works with Kysely and Drizzle ORM for making type-safe queries

## Examples

```javascript
import { SQLocal } from 'sqlocal';

// Create a client with a name for the SQLite file to save in
// the origin private file system
const { sql } = new SQLocal('database.sqlite3');

// Use the "sql" tagged template to execute a SQL statement
// against the SQLite database
await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`;

// Execute a parameterized statement just by inserting 
// parameters in the SQL string
const items = ['bread', 'milk', 'rice'];
for (let item of items) {
  await sql`INSERT INTO groceries (name) VALUES (${item})`;
}

// SELECT queries and queries with the RETURNING clause will
// return the matched records as an array of objects
const data = await sql`SELECT * FROM groceries`;
console.log(data);
```

Log:

```javascript
[
  { id: 1, name: 'bread' },
  { id: 2, name: 'milk' },
  { id: 3, name: 'rice' }
]
```

Or, you can use SQLocal as a driver for [Kysely](https://kysely.dev/) or [Drizzle ORM](https://orm.drizzle.team/) to make fully-typed queries.

### Kysely

```typescript
import { SQLocalKysely } from 'sqlocal/kysely';
import { Kysely, Generated } from 'kysely';

// Initialize SQLocalKysely and pass the dialect to Kysely
const { dialect } = new SQLocalKysely('database.sqlite3');
const db = new Kysely<DB>({ dialect });

// Define your schema 
// (passed to the Kysely generic above)
type DB = {
  groceries: {
    id: Generated<number>;
    name: string;
  };
};

// Make type-safe queries
const data = await db
  .selectFrom('groceries')
  .select('name')
  .orderBy('name', 'asc')
  .execute();
console.log(data);
```

See the Kysely documentation for [getting started](https://kysely.dev/docs/getting-started?dialect=sqlite).

### Drizzle

```typescript
import { SQLocalDrizzle } from 'sqlocal/drizzle';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { sqliteTable, int, text } from 'drizzle-orm/sqlite-core';

// Initialize SQLocalDrizzle and pass the driver to Drizzle
const { driver } = new SQLocalDrizzle('database.sqlite3');
const db = drizzle(driver);

// Define your schema
const groceries = sqliteTable('groceries', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

// Make type-safe queries
const data = await db
  .select({ name: groceries.name })
  .from(groceries)
  .orderBy(groceries.name)
  .all();
console.log(data);
```

See the Drizzle ORM documentation for [declaring your schema](https://orm.drizzle.team/docs/sql-schema-declaration) and [making queries](https://orm.drizzle.team/docs/crud).

## Install

Install the SQLocal package in your application using your package manager.

```sh
npm install sqlocal
# or...
yarn add sqlocal
# or...
pnpm install sqlocal
```

### Cross-Origin Isolation

In order to persist data to the origin private file system, this package relies on APIs that require cross-origin isolation, so the page you use this package on must be served with the following HTTP headers. Otherwise, the browser will block access to the origin private file system.

```http
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

If your development server uses Vite, you can do this by adding the following to your Vite configuration.

```javascript
plugins: [
  {
    name: 'configure-response-headers',
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        next();
      });
    },
  },
],
```

### Vite Configuration

Vite currently has an issue that prevents it from loading web worker files correctly with the default configuration. If you use Vite, please add the below to your Vite configuration to fix this.

```javascript
optimizeDeps: {
  exclude: ['sqlocal'],
},
```

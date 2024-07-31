# Introduction

SQLocal makes it easy to run SQLite3 in the browser, backed by the origin private file system which provides high-performance read/write access to a SQLite database file stored on the user's device.

SQLocal acts as a lightweight wrapper of the [WebAssembly build of SQLite3](https://sqlite.org/wasm/doc/trunk/index.md) and gives you a simple interface to interact with databases running locally. It can also act as a database driver for [Kysely](/kysely/setup) or [Drizzle ORM](/drizzle/setup) to make fully-typed queries.

Having the ability to store and query relational data on device makes it possible to build powerful, local-first web apps and games no matter the complexity of your data model.

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
	{ id: 3, name: 'rice' },
];
```

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

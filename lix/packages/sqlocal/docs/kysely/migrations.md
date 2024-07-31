# Kysely Migrations

As you update your app, you need to ensure that every user's database schema remains compatible with your app's logic. To do this, you can run [Kysely migrations](https://kysely.dev/docs/migrations) in the frontend through your SQLocal client.

## Create Migrations

Since SQLocal runs in the frontend, your app's migrations should be included in the frontend bundle as well. To prepare migrations to use with Kysely in the frontend, we need to build a migrations object where each entry has a `string` key and a value that is a Kysely `Migration` object.

For example, let's consider the file structure below. We have each `Migration` live in its own file in the `migrations` directory, and we have an `index.ts` file where we combine all the `Migration`s into the full migrations object.

```
.
├── database/
│   ├── migrations/
│   │   ├── 2023-08-01.ts
│   │   ├── 2023-08-02.ts
│   │   └── index.ts
│   ├── client.ts
│   ├── migrator.ts
│   └── schema.ts
└── main.ts
```

Each `Migration` has an `up` method and a `down` method which run Kysely queries. The `up` method migrates the database, and the `down` method does the inverse of the `up` method in case you ever need to rollback migrations.

With your `Migration` object written, import it into the `index.ts` file, and add it to the migrations object, which should be the type `Record<string, Migration>`. The keys you use here will determine the order that Kysely runs the migrations in, so they need to be numbered or start with a date or timestamp.

::: code-group

```typescript [index.ts]
import { Migration } from 'kysely';
import { Migration20230801 } from './2023-08-01';
import { Migration20230802 } from './2023-08-02';

export const migrations: Record<string, Migration> = {
	'2023-08-01': Migration20230801,
	'2023-08-02': Migration20230802,
};
```

```typescript [2023-08-01.ts]
import type { Kysely, Migration } from 'kysely';

export const Migration20230801: Migration = {
	async up(db: Kysely<any>) {
		await db.schema
			.createTable('groceries')
			.addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
			.addColumn('name', 'text', (cb) => cb.notNull())
			.execute();
	},
	async down(db: Kysely<any>) {
		await db.schema.dropTable('groceries').execute();
	},
};
```

:::

## Create Migrator

With the migrations object ready, we can create the Kysely `Migrator` that will read those migrations to execute them. `Migrator` needs to be passed `db`, which is your `Kysely` instance initialized with the `SQLocalKysely` dialect, and a `provider` which implements a `getMigrations` method to fetch the migrations object we made before. This can be accomplished with a dynamic `import` of the migrations from the `index.ts` file.

::: code-group

```typescript [migrator.ts]
import { Migrator } from 'kysely';
import { db } from './client';

export const migrator = new Migrator({
	db,
	provider: {
		async getMigrations() {
			const { migrations } = await import('./migrations/');
			return migrations;
		},
	},
});
```

```typescript [client.ts]
import { SQLocalKysely } from 'sqlocal/kysely';
import { Kysely } from 'kysely';
import type { Database } from './schema';

const { dialect } = new SQLocalKysely('database.sqlite3');
export const db = new Kysely<Database>({ dialect });
```

```typescript [schema.ts]
import type { Generated } from 'kysely';

export type Database = {
	groceries: GroceriesTable;
};

export type GroceriesTable = {
	id: Generated<number>;
	name: string;
	quantity: number;
};
```

:::

## Run Migrations

All that's left now is to put that `Migrator` to use. Import it wherever your app initializes and call its `migrateToLatest` method. This will execute, in order, any of the migrations that have not yet been run against the database instance that was passed to the `Migrator`.

```typescript [main.ts]
import { migrator } from './database/migrator';

await migrator.migrateToLatest();
```

The `Migrator` also has other methods to run migrations as needed.

```typescript
// run the next migration
await migrator.migrateUp();
// rollback the last migration
await migrator.migrateDown();
// migrate to the point of the migration passed by key
await migrator.migrateTo('2023-08-01');
```

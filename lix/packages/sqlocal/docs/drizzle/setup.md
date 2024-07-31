# Drizzle ORM Setup

SQLocal provides a driver for [Drizzle ORM](https://orm.drizzle.team/) so that you can use it to make fully typed queries against databases in your TypeScript codebase.

## Install

Install the Drizzle ORM package alongside SQLocal in your application using your package manager.

::: code-group

```sh [npm]
npm install sqlocal drizzle-orm
```

```sh [yarn]
yarn add sqlocal drizzle-orm
```

```sh [pnpm]
pnpm install sqlocal drizzle-orm
```

:::

## Initialize

SQLocal provides the Drizzle ORM driver from a child class of `SQLocal` called `SQLocalDrizzle` imported from `sqlocal/drizzle`. This class has all the same methods as `SQLocal` but adds `driver` and `batchDriver` which you pass to the `drizzle` instance.

```typescript
import { SQLocalDrizzle } from 'sqlocal/drizzle';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

const { driver, batchDriver } = new SQLocalDrizzle('database.sqlite3');
export const db = drizzle(driver, batchDriver);
```

Now, any queries you run through this Drizzle instance will be executed against the database passed to `SQLocalDrizzle`.

## Define Schema

Define your schema using the functions that Drizzle ORM provides. You will need to import the table definitions where you will be making queries. See the [Drizzle documentation](https://orm.drizzle.team/docs/sql-schema-declaration).

```typescript
import { sqliteTable, int, text } from 'drizzle-orm/sqlite-core';

export const groceries = sqliteTable('groceries', {
	id: int('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
});
```

## Make Queries

Import your Drizzle instance to start making type-safe queries.

```typescript
const data = await db
	.select({ name: groceries.name, quantity: groceries.quantity })
	.from(groceries)
	.orderBy(groceries.name)
	.all();
console.log(data);
```

See the [Drizzle documentation](https://orm.drizzle.team/docs/crud) for more examples.

## Transactions

[Drizzle's `transaction` method](https://orm.drizzle.team/docs/transactions) cannot isolate transactions from outside queries. It is recommended to use the `transaction` method of `SQLocalDrizzle` instead. See the [`transaction` documentation](../api/transaction.md#drizzle).

# Kysely Query Builder Setup

SQLocal provides a dialect for the [Kysely](https://kysely.dev/) query builder so that you can use it to make fully typed queries against databases in your TypeScript codebase.

## Install

Install the Kysely package alongside SQLocal in your application using your package manager.

::: code-group

```sh [npm]
npm install sqlocal kysely
```

```sh [yarn]
yarn add sqlocal kysely
```

```sh [pnpm]
pnpm install sqlocal kysely
```

:::

## Initialize

SQLocal provides the Kysely dialect from a child class of `SQLocal` called `SQLocalKysely` imported from `sqlocal/kysely`. This class has all the same methods as `SQLocal` and adds `dialect` which you pass to the `Kysely` instance.

```typescript
import { SQLocalKysely } from 'sqlocal/kysely';
import { Kysely } from 'kysely';

const { dialect } = new SQLocalKysely('database.sqlite3');
export const db = new Kysely({ dialect });
```

Now, any queries you run through this Kysely instance will be executed against the database passed to `SQLocalKysely`.

## Define Schema

With Kysely, your schema is defined using TypeScript object types. See the [Kysely documentation](https://kysely.dev/docs/getting-started#types).

```typescript
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

With this defined, pass the database type to the Kysely instance, and your queries built with Kysely will now have auto-complete and type checking.

```typescript
export const db = new Kysely<Database>({ dialect });
```

## Make Queries

Import your Kysely instance to start making type-safe queries.

```typescript
const data = await db
	.selectFrom('groceries')
	.select(['name', 'quantity'])
	.orderBy('name', 'asc')
	.execute();
console.log(data);
```

See the [Kysely documentation](https://kysely.dev/docs/category/examples) for more examples.

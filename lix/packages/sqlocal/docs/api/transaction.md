# transaction

Execute SQL transactions against the database.

## Usage

Access or destructure `transaction` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { transaction } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `transaction` method provides a way to execute a transaction on the database, ensuring atomicity and isolation of the SQL queries executed within it. `transaction` takes a callback that is passed a `tx` object containing a `sql` tagged template for executing SQL within the transaction.

This `sql` tag function passed in the `tx` object works similarly to the [`sql` tag function used for single queries](sql.md), but it ensures that the queries are executed in the context of the open transaction. Any logic can be carried out in the callback between the queries as needed.

If any of the queries fail or any other error is thrown within the callback, `transaction` will throw an error and the transaction will be rolled back automatically. If the callback completes successfully, the transaction will be committed.

The callback can return any value desired, and if the transaction succeeds, this value will be returned from `transaction`.

```javascript
const productName = 'rice';
const productPrice = 2.99;

const newProductId = await transaction(async (tx) => {
	const [product] = await tx.sql`
		INSERT INTO groceries (name) VALUES (${productName}) RETURNING *
	`;
	await tx.sql`
		INSERT INTO prices (groceryId, price) VALUES (${product.id}, ${productPrice})
	`;
	return product.id;
});
```

## Drizzle

Drizzle queries can also be used with `transaction` by passing them to the `tx` object's `query` function. `query` will execute the Drizzle query as part of the transaction and its return value will be typed according to Drizzle.

This is the recommended way to execute transactions when using Drizzle with SQLocal. The [`transaction` method provided by Drizzle](https://orm.drizzle.team/docs/transactions) does not ensure isolation, so queries executed outside of the Drizzle transaction at the same time may create a data inconsistency.

```javascript
const productName = 'rice';
const productPrice = 2.99;

const newProductId = await transaction(async (tx) => {
	const [product] = await tx.query(
		db.insert(groceries).values({ name: productName }).returning()
	);
	await tx.query(
		db.insert(prices).values({ groceryId: product.id, price: productPrice })
	);
	return product.id;
});
```

## Kysely

Kysely queries can be used with `transaction` by calling Kysely's `compile` method on the queries and passing them to the `tx` object's `query` function. `query` will execute the Kysely query as part of the transaction and its return value will be typed according to Kysely.

Functionally, SQLocal's `transaction` method and [Kysely's `transaction` method](https://kysely.dev/docs/examples/transactions/simple-transaction) are very similar. Both can ensure atomicity and isolation of the transaction, so either method can be used to the same effect as preferred.

```javascript
const productName = 'rice';
const productPrice = 2.99;

const newProductId = await transaction(async (tx) => {
	const [product] = await tx.query(
		db
			.insertInto('groceries')
			.values({ name: productName })
			.returningAll()
			.compile()
	);
	await tx.query(
		db
			.insertInto('prices')
			.values({ groceryId: product.id, price: productPrice })
			.compile()
	);
	return product.id;
});
```

# batch

Execute a batch of SQL queries against the database in an atomic way.

## Usage

Access or destructure `batch` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { batch } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `batch` function takes a group of SQL queries, passes them to the database all together, and executes them inside a transaction. If any of the queries fail, `batch` will throw an error, and the transaction will be rolled back automatically. If all queries succeed, the transaction will be committed and the results from each query will be returned.

Provide a function to `batch` that returns an array of SQL queries constructed using the `sql` tagged template function passed to it. This `sql` tag function works similarly to the [`sql` tag function used for single queries](sql.md), but the queries passed to `batch` should not be individually `await`ed. Await the call to `batch`, and each query will be executed against the database in order.

```javascript
const senderId = 1;
const receiverId = 2;
const coins = 4856;

// Ensures that these 3 queries either all succeed
// or get rolled back
await batch((sql) => [
	sql`INSERT INTO transfer (senderId, receiverId, coins) VALUES (${senderId}, ${receiverId}, ${coins})`,
	sql`UPDATE player SET coins = coins - ${coins} WHERE id = ${senderId}`,
	sql`UPDATE player SET coins = coins + ${coins} WHERE id = ${receiverId}`,
]);

// Results from queries will also be returned as
// items in an array, one item per query
const [players, transfers] = await batch((sql) => [
	sql`SELECT * FROM player WHERE id = ${senderId} OR id = ${receiverId}`,
	sql`SELECT * FROM transfer WHERE senderId = ${senderId}`,
]);
```

`batch` ensures atomicity and isolation for the queries it executes, but if you also need to execute other logic between queries, you should use the [`transaction` method](transaction.md).

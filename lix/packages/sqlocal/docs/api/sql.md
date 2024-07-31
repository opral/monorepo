# sql

Execute SQL queries against the database.

## Usage

Access or destructure `sql` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { sql } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

`sql` is used as a [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates). Values interpolated into the query string will be passed to the database as parameters to that query.

```javascript
const item = 'Bread';
const quantity = 2;
await sql`INSERT INTO groceries (name, quantity) VALUES (${item}, ${quantity})`;
```

SELECT queries and queries with the RETURNING clause will return the matched records as an array of objects.

```javascript
const data = await sql`SELECT * FROM groceries`;
console.log(data);
```

Example result:

```javascript
[
	{ id: 1, name: 'Rice', quantity: 4 },
	{ id: 2, name: 'Milk', quantity: 1 },
	{ id: 3, name: 'Bread', quantity: 2 },
];
```

Multiple statements can be passed in the query, but note that the results returned will only include results from the first value-returning statement. Also, only one statement in the query can have parameter bindings. Because of these restrictions, it is recommended to pass only one SQL statement per call to `sql`. To run multiple statements together, use the [`batch` method](batch.md).

```javascript
// Warning: only returns the row with id 1.
const result = await sql`
	SELECT * FROM foo WHERE id = 1; 
	SELECT * FROM foo WHERE id = 2;
`;

// Recommended: one statement per query
const result1 = await sql`SELECT * FROM foo WHERE id = 1;`;
const result2 = await sql`SELECT * FROM foo WHERE id = 2;`;
```

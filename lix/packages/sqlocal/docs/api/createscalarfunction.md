# createScalarFunction

Create a SQL function that can be called from queries to transform column values or to filter rows.

## Usage

Access or destructure `createScalarFunction` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { createScalarFunction } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

This method takes a string to name a custom SQL function as its first argument and a callback function as its second argument which the SQL function will call. After running `createScalarFunction`, the function that you defined can be called from subsequent SQL queries. Arguments passed to the function in the SQL query will be passed to the JavaScript callback, and the return value of the callback will be passed back to SQLite to use to complete the query.

This can be used to perform custom transformations on column values in a query. For example, you could define a function that converts temperatures from Celsius to Fahrenheit.

```javascript
await createScalarFunction('toFahrenheit', (celsius) => {
	return celsius * (9 / 5) + 32;
});

await sql`SELECT celsius, toFahrenheit(celsius) AS fahrenheit FROM temperatures`;
```

Scalar functions can also be used in a query's WHERE clause to filter rows.

```javascript
await createScalarFunction('isEven', (num) => num % 2 === 0);

await sql`SELECT num FROM nums WHERE isEven(num)`;
```

<!-- @include: ../_partials/functions-note.md -->

# createCallbackFunction

Create a SQL function that can be called from queries to trigger a JavaScript callback.

## Usage

Access or destructure `createCallbackFunction` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { createCallbackFunction } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

This method takes a string to name a custom SQL function as its first argument and a callback function as its second argument which the SQL function will call. After running `createCallbackFunction`, the function that you defined can be called from subsequent SQL queries. Arguments passed to the function in the SQL query will be passed to the JavaScript callback.

A good use-case for this is making SQL triggers that notify your application when certain mutations are made in the database. For example, let's create a `logInsert` callback function that takes a table name and a record name to log a message.

```javascript
await createCallbackFunction('logInsert', (tableName, recordName) => {
	console.log(`New ${tableName} record created with name: ${recordName}`);
});
```

Then, we can create a temporary trigger that calls `logInsert` whenever we insert a row into our `groceries` table.

```javascript
await sql`
  CREATE TEMP TRIGGER logGroceriesInsert AFTER INSERT ON groceries
  BEGIN
    SELECT logInsert('groceries', new.name);
  END
`;
```

Now, a message will be automatically logged whenever a query on the same connection inserts into the `groceries` table.

```javascript
await sql`INSERT INTO groceries (name) VALUES ('bread')`;
```

```log
New groceries record created with name: bread
```

<!-- @include: ../_partials/functions-note.md -->

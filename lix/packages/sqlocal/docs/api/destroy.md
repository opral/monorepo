# destroy

Disconnect a SQLocal client from the database and terminate its worker thread.

## Usage

Access or destructure `destroy` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { destroy } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `destroy` method takes no arguments. It will return a `Promise` to close the connection to the SQLite database file and then terminate the Web Worker that the `SQLocal` client uses internally to run queries.

It will also execute [`PRAGMA optimize`](https://www.sqlite.org/pragma.html#pragma_optimize) on the database before closing the connection.

Call `destroy` if you want to clean up an `SQLocal` instance because you are finished querying its associated database for the remainder of the session. **Avoid** calling `destroy` after each query and then initializing a new `SQLocal` instance for the next query.

```javascript
await destroy();
```

::: warning
Once the `destroy` method is called on an `SQLocal` instance, any subsequent attempts to make queries through that instance will throw an error. You will need to initialize a new instance of `SQLocal` to make new queries.
:::

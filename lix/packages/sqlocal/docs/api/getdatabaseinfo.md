# getDatabaseInfo

Retrieve information about the SQLite database file.

## Usage

Access or destructure `getDatabaseInfo` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { getDatabaseInfo } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `getDatabaseInfo` method takes no arguments. It will return a `Promise` for an object that contains information about the database file being used by the `SQLocal` instance.

```javascript
const databaseInfo = await getDatabaseInfo();
```

The returned object contains the following properties:

- **`databasePath`** (`string`) - The name of the database file. This will be identical to the value passed to the `SQLocal` constructor at initialization.
- **`databaseSizeBytes`** (`number`) - An integer representing the current file size of the database in bytes.
- **`storageType`** (`'memory' | 'opfs'`) - A string indicating whether the database is saved in the origin private file system or in memory. The database only falls back to being saved in memory if the OPFS cannot be used, such as when the browser does not support it.
- **`persisted`** (`boolean`) - This is `true` if the database is saved in the origin private file system _and_ the application has used [`navigator.storage.persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) to instruct the browser not to automatically evict the site's storage.

If the `SQLocal` instance failed to initialize a database connection, these properties may be `undefined`.

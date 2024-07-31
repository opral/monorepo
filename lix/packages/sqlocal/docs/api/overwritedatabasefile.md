# overwriteDatabaseFile

Replace the contents of the SQLite database file.

## Usage

Access or destructure `overwriteDatabaseFile` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { overwriteDatabaseFile } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `overwriteDatabaseFile` method takes a database file as a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), or [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) object and returns a `Promise` to replace the `SQLocal` instance's associated database file with the one provided.

For example, you can download a database file from your server to replace the local file.

```javascript
const response = await fetch('https://example.com/download?id=12345');
const databaseFile = await response.blob();
await overwriteDatabaseFile(databaseFile);
```

Or, your app may allow the user to import a database file.

```javascript
const fileInput = document.querySelector('input[type="file"]');
const databaseFile = fileInput.files[0];
await overwriteDatabaseFile(databaseFile);
```

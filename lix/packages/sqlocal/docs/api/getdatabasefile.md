# getDatabaseFile

Access the SQLite database file so that it can be uploaded to the server or allowed to be downloaded by the user.

## Usage

Access or destructure `getDatabaseFile` from the `SQLocal` client.

```javascript
import { SQLocal } from 'sqlocal';

export const { getDatabaseFile } = new SQLocal('database.sqlite3');
```

<!-- @include: ../_partials/initialization-note.md -->

The `getDatabaseFile` method takes no arguments. It will return a `Promise` for a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) object. That object can then be used to upload or download the database file of the `SQLocal` instance.

For example, you can upload the database file to your server.

```javascript
const databaseFile = await getDatabaseFile();
const formData = new FormData();
formData.set('databaseFile', databaseFile);

await fetch('https://example.com/upload', {
	method: 'POST',
	body: formData,
});
```

Or, you can use it to make the database file available to the user for download.

```javascript
const databaseFile = await getDatabaseFile();
const fileUrl = URL.createObjectURL(databaseFile);

const a = document.createElement('a');
a.href = fileUrl;
a.download = 'database.sqlite3';
a.click();
a.remove();

URL.revokeObjectURL(fileUrl);
```

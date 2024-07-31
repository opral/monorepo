# Setup

Prepare the SQLocal client and connect to a database.

## Install

Install the SQLocal package in your application using your package manager.

::: code-group

```sh [npm]
npm install sqlocal
```

```sh [yarn]
yarn add sqlocal
```

```sh [pnpm]
pnpm install sqlocal
```

:::

## Cross-Origin Isolation

In order to persist data to the origin private file system, this package relies on APIs that require cross-origin isolation, so the page you use this package on must be served with the following HTTP headers. Otherwise, the browser will block access to the origin private file system.

```http
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

How this is configured will depend on what web server or hosting service your application uses. If your development server uses Vite, [see the configuration below](#vite-configuration).

## Initialize

Import the `SQLocal` class to initialize your client for interacting with a local SQLite database.

```javascript
import { SQLocal } from 'sqlocal';

export const db = new SQLocal('database.sqlite3');
```

Pass the file name for your SQLite database file to the `SQLocal` constructor, and the client will connect to that database file. If your file does not already exist in the origin private file system, it will be created automatically.

The file extension that you use does not matter for functionality. It is conventional to use `.sqlite3` or `.db`, but feel free to use whatever extension you need to (e.g., you are using [SQLite as an application file format](https://www.sqlite.org/aff_short.html)).

You will probably also want to export the client so that you can use it throughout your application.

If your application needs to query multiple databases, you can initialize another instance of `SQLocal` for each database.

With the client initialized, you are ready to [start making queries](/api/sql).

<!-- @include: ../_partials/initialization-note.md -->

## Options

The `SQLocal` constructor can also be passed an object to accept additional options.

```javascript
export const db = new SQLocal({
	databasePath: 'database.sqlite3',
	readOnly: true,
	verbose: true,
});
```

- **`databasePath`** (`string`) - The file name for the database file. This is the only required option.
- **`readOnly`** (`boolean`) - If `true`, connect to the database in read-only mode. Attempts to run queries that would mutate the database will throw an error.
- **`verbose`** (`boolean`) - If `true`, any SQL executed on the database will be logged to the console.

## Vite Configuration

Vite currently has an issue that prevents it from loading web worker files correctly with the default configuration. If you use Vite, please add the below to your [Vite configuration](https://vitejs.dev/config/) to fix this. Don't worry: it will have no impact on production performance.

```javascript
optimizeDeps: {
  exclude: ['sqlocal'],
},
```

To enable cross-origin isolation (required for origin private file system persistence) for the Vite development server, you can add this to your Vite configuration. Just don't forget to also configure your _production_ web server to use the same HTTP headers.

```javascript
plugins: [
  {
    name: 'configure-response-headers',
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        next();
      });
    },
  },
],
```

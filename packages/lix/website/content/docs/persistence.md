# Persistence

By default, `openLix()` runs in-memory. For production use, Lix is persisted as a single blob you can drop wherever you already store data: disk, OPFS, object storage, or a database column.

Why this matters: you adopt Lix without redesigning storage. Keep Postgres, filesystem, browser storage, or object store as-is—persist the blob there and reopen the identical project anywhere the SDK runs.

**Patterns at a glance**

| Where you store it         | How                                                | Note                                        |
| -------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Filesystem (Node)          | `writeFile(Buffer.from(await blob.arrayBuffer()))` | Use `.lix` extension                        |
| Object storage (S3/GCS)    | Upload the bytes as `application/octet-stream`     | Same blob downloads and reopens unchanged   |
| Database column (Postgres) | Store in `bytea`; reopen with `new Blob([bytes])`  | Fits existing doc storage patterns          |
| Browser (OPFS)             | `new OpfsSahEnvironment({ key })`                  | Persisted, non-blocking in the browser      |
| In-memory (tests, demos)   | Default in-memory instance                         | Great for unit tests and ephemeral sessions |

## Save a Lix to disk (Node)

Same blob, different home. Write it to disk and reopen later on any machine.

```ts
import { writeFile, readFile } from "node:fs/promises";
import { openLix } from "@lix-js/sdk";

// ...work with your lix...
const blob = await lix.toBlob();
await writeFile("repo.lix", Buffer.from(await blob.arrayBuffer()));

// Later: reload the same project
const bytes = await readFile("repo.lix");
const reloaded = await openLix({ blob: new Blob([bytes]) });
```

## Persist to cloud object storage (e.g., S3)

Upload the blob to object storage; download it later and reopen unchanged.

`lix.toBlob()` returns plain bytes, so you can upload the blob to any object
store and pull it back down later.

```ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { openLix } from "@lix-js/sdk";

const s3 = new S3Client({ region: "us-east-1" });
const bucket = "my-lix-snapshots";
const key = "repo.lix";

// Upload
const blob = await lix.toBlob();
await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(await blob.arrayBuffer()),
    ContentType: "application/octet-stream",
  }),
);

// Download and reopen
const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
const bytes = Buffer.from(await obj.Body!.transformToByteArray());
const restored = await openLix({ blob: new Blob([bytes]) });
```

Any HTTP upload/download flow works the same way—treat the `.lix` blob like any
binary file.

## Store in a database column (e.g., Postgres)

If your app already stores documents (Markdown, TipTap JSON, etc.) in a column,
persist the same `.lix` blob there for built-in change control.

```ts
import { Pool } from "pg";
import { openLix } from "@lix-js/sdk";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Save a Lix snapshot
const blob = await lix.toBlob();
await pool.query(
  "INSERT INTO documents (id, title, lix_blob) VALUES ($1, $2, $3)\n   ON CONFLICT (id) DO UPDATE SET lix_blob = EXCLUDED.lix_blob",
  [docId, title, Buffer.from(await blob.arrayBuffer())],
);

// Load and reopen later
const { rows } = await pool.query(
  "SELECT lix_blob FROM documents WHERE id = $1",
  [docId],
);
const bytes: Buffer = rows[0].lix_blob;
const restored = await openLix({ blob: new Blob([bytes]) });
```

Use a binary column type (`bytea` in Postgres) and treat the `.lix` payload just
like any other document payload. When you reopen with `openLix({ blob })`, you
get the full Lix state back without changing your storage model.

## Browser persistence with OPFS

For persistent, non-blocking storage in the browser, run Lix in the
`OpfsSahEnvironment`. This environment **automatically persists** every change to the browser's
private file system ([Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)).

See the [Environment API](/docs/environment-api) for how environments control
where your Lix runs and persists.

### Resume a session

To load the existing project from storage (or create a new empty one if none exists), open Lix without a blob:

```ts
import { openLix, OpfsSahEnvironment } from "@lix-js/sdk";

// Opens "my-app" from OPFS, or creates it if missing.
const lix = await openLix({
  environment: new OpfsSahEnvironment({ key: "my-app" }),
});
```

### Import or Restore

To overwrite the persisted data with a snapshot (e.g., restoring a backup), pass the `blob`:

```ts
// Initializes (or overwrites) "my-app" in OPFS with the provided blob
const lix = await openLix({
  blob: incomingBlob,
  environment: new OpfsSahEnvironment({ key: "my-app" }),
});
```

### Export

You can create a snapshot at any time without interrupting your session:

```ts
// Snapshot to a .lix file for backup/export
const blob = await lix.toBlob();
const url = URL.createObjectURL(blob);
// download as shown above
```

## In-memory (tests, demos)

The default Lix instance runs in memory—perfect for unit tests, demos, and
ephemeral sessions. Export a blob when you want to persist or share the state.

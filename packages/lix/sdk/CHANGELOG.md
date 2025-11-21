# @lix-js/sdk

## 0.5.0

### Minor Changes

- 68a939b: Refactored the architecture of lix to be event-sourced.

  Changes are now the source of truth which allows re-materialization of state at any point in time, and re-assurance of data integrity.

  Lix up to v0.4 used SQLite event triggers to track changes. The risk of missing triggers combined with a lack of hooking into the commit process meant that changes could be lost or not properly tracked.

  This release includes:

  - **Lix Engine**: A query engine (`packages/lix/sdk/src/engine`) that includes a custom SQL parser, preprocessor, and query optimizer to map queries to native SQL.

  - **Reactive queries**: subscribe UI components to live data with `lix.observe()`; emits on every state commit for polling-free updates.

  - **Diffing + history**: working/checkpoint and commit-to-commit diffs, plus a `state_history` view for blame and time-travel.

  - **Change proposals**: change proposals with conversations/messages and per-change authorship for review flows.

  - **Support for directories**: built-in directory/file descriptors and path helpers replace the old file-queue plumbing.

  - **Engine portabilityy**: `openLix` now accepts raw plugin modules and exposes `lix.call(...)` for worker/remote environments.

  - **New Transaction Model**: A formal 3-stage mutation lifecycle (Mutation -> Transaction -> Commit) ensures ACID guarantees and clearer change tracking.

  - **Schema definition API**: API for defining custom entity schemas, making Lix extensible for any data type.

## 0.4.7

### Patch Changes

- aa4d69e: expose `closeLix()` api

## 0.4.6

### Patch Changes

- f634538: lower sampling in telemetry event to reduce amounts of events

## 0.4.5

### Patch Changes

- 275d87e: improve: `createChangeSet()` now accepts labels to associate with the change set

  Before:

  ```ts
  await createChangeSet({
  	lix,
  	changes: [],
  	// ❌ no way to add labels
  });
  ```

  After:

  ```ts
  // Get existing labels
  const labels = await lix.db.selectFrom("label").selectAll().execute();

  await createChangeSet({
  	lix,
  	changes: [],
  	// ✅ associate labels with the change set
  	labels,
  });
  ```

- dc92f56: - Rename `lix-server-api` to `lix-server-protocol` for improved clarity and consistent naming. All functionality remains backward compatible. The following changes were made:
  - Renamed server-api-handler directory to server-protocol-handler
  - Renamed server endpoints from /lsa/ to /lsp/
  - Updated imports in all affected files
  - Added backward compatibility aliases to ensure existing code continues to work
- c1ed545: improve: `createChangeSet()` now takes an empty list of changes without throwing

  Before:

  ```ts
  await createChangeSet({
  	lix,
  	// 💥 throws FOREIGN KEY CONSTRAINT violation
  	changes: [],
  });
  ```

  After:

  ```ts
  await createChangeSet({
  	lix,
  	// ✅ does not throw
  	changes: [],
  });
  ```

## 0.4.4

### Patch Changes

- 85478f8: chore: reduce the minmum node version to v18 to unblock adoption https://github.com/opral/lix-sdk/issues/277

## 0.4.3

### Patch Changes

- 8ce6666: Fix glob pattern behavior in file queue by removing prepending slash and add proper null checks for `plugin.detectChangesGlob`.

  Also update the error message explanation for file paths to correctly state why paths need to start with a root slash.

## 0.4.2

### Patch Changes

- 59f6c92: Add polyfill for crypto.getRandomValues to ensure nanoid works in environments without crypto support (like older versions of Node in Stackblitz). Fixes https://github.com/opral/lix-sdk/issues/258

## 0.4.1

### Patch Changes

- c0b857a: expose `KeyValue` types

## 0.4.0

### Minor Changes

- 1c84afb: disabled plugin loading from the file table because unused and led to https://github.com/opral/inlang-paraglide-js/issues/350

### Patch Changes

- 175f7f9: @lix-js/sdk:

  - define UiDiffComponent type
  - diff components can now consume multiple diffs

  @lix-js/plugin-csv:

  - update to use new diff component type
  - display multiple diffs in a single component
  - add rowId to snapshot content
  - group diffs by rowId

  lix-file-manager:

  - add checkpoint timeline instead of change list
  - refactor API diff component rendering
  - refactor queries to use new UiDiffComponent type

  PR URL:
  https://github.com/opral/monorepo/pull/3377

  - @lix-js/server-api-schema@0.1.1

## 0.3.5

### Patch Changes

- Updated dependencies [b87f8a8]
  - sqlite-wasm-kysely@0.3.0

## 0.3.4

### Patch Changes

- Updated dependencies [31e8fb8]
  - sqlite-wasm-kysely@0.2.0

## 0.3.3

### Patch Changes

- 7fd8092: fix: account for db close via "driver has already been destroyed" in file queue

## 0.3.2

### Patch Changes

- d71b3c7: move @lix-js/server-api-schema to regular dependencies

## 0.3.0

### Minor Changes

- c3d2d8e: Refactor: change "confirmed" to "checkpoint" and "unconfirmed" to "intermediate"

## 0.2.0

### Minor Changes

- 657bdc4: adds a telemetry event for opening a lix as well as the option to disable telemetry
- 0de2866: refactor: removes the `anonymous_` prefix from "anonymous accounts".

  Closes https://github.com/opral/lix-sdk/issues/233.

  There is no difference between an account prefixed with `anonymous` and one that is not. This change removes the prefix to avoid confusion.

- 03e746d: add the option to open a lix with an existing account

  ```ts
  const account = localStorage.getItem("account");
  await openLix({ account });
  ```

### Patch Changes

- 48fac78: fix: sync process does not create new intervals after the database has been closed

  this bug hindered node processes to exit https://github.com/opral/inlang-sdk/issues/155

- Updated dependencies [7046bc3]
  - sqlite-wasm-kysely@0.1.1

## 0.1.0

### Minor Changes

- 4d9d980: adds unique and default human readable version names

  - removes nullability of `version.name` which eases conditional logic.
  - apps don't need custom default version naming logic anymore

- cc93bd9: Refactor: Use [nano-ids](https://zelark.github.io/nano-id-cc/) for change controlled tables like discussions, comments, and labels.

  - severely shortens the length of shareable URLs
  - closes https://github.com/opral/lix-sdk/issues/189.

  ```diff
  -http://localhost:3005/app/fm/?f=0193f041-21ce-7ffc-ba6e-d2d62b399383&d=0193f041-2457-7ffc-ba7e-494efc37b1b8&l=55a7bcc8-63d8-43b7-af0b-3916618fc258
  +http://localhost:3005/app/fm/?f=tUYFRUe4lb&d=rrzumhqqTOwq&l=MftKxYHfDw2bSVr8Bs
  ```

  **Additional information**

  The pattern is still not human readable. I assume that we will introduce a human readable pattern in the future in addition to permalinks. This change is a incremental step towards better link sharing and good enough for now.

  **Performance implications**

  Nano IDs are not sortable and theoretically make insertions slower. However, until we get lix'es that have billions of rows we need to get users first. Sharing is a key feature to get users.

### Patch Changes

- 85eb03e: refactor: remove `comment.created_at` and `comment.created_by` https://github.com/opral/lix-sdk/issues/175

  Comments and discussions are now change controlled. Hence, knowing when a comment or discussion has been created can be queried via the changes. This removes the need for the `created_at` and `created_by` fields on the `Comment` and `Discussion` entities, and thereby simplifies the schema, avoids duplicate date, and reduces the risk of inconsistencies.

- 2d3ab95: refactor: explicit `firstComment` argument in `createDiscussion()` https://github.com/opral/lix-sdk/issues/164

  It was unclear that the `content` argument in `createDiscussion()` was meant to be the first comment. This change makes it explicit by renaming the argument to `firstComment`.

  ```diff
  - createDiscussion({ discussion, content: "first comment" })
  + createDiscussion({ discussion, firstComment: { content: "first commment" } }})
  ```

- d78a1bf: improve: remove top level await in json parsing

  required for lix apps that transpile to CJS. CJS does not support top level await.
  see https://github.com/evanw/esbuild/issues/253

- 6b14433: refactor: rename `change_queue` to `file_queue` https://github.com/opral/lix-sdk/issues/168

  ```diff
  -db.selectFrom("change_queue")
  +db.selectFrom("file_queue")
  ```

- 9f1765a: refactor: rename plugin_key: `lix_own_entity`/`lix_own_change_control` to `lix_sdk`

  Closes https://github.com/opral/lix-sdk/issues/197

- c494dca: refactor: remove `change_set_label_author` table.

  Closes https://github.com/opral/lix-sdk/issues/227

  Change set labels are now under own change control. Querying who created a label can happen via the change table itself.

- fc5a5dd: fix: duplicate version changes

  Closes https://github.com/opral/lix-sdk/issues/217 by making version changes have a unique (entity_id, file_id, schema_key).

  Sync was buggy because the sync process is an async process. A client received multiple version changes for the same entity and inserted them https://github.com/opral/lix-sdk/issues/217#issuecomment-2549545901 without checking if the version change for the entity already exists.

- 8c4ac57: refactor: rename `parent` to `from` in `createVersion()` https://github.com/opral/lix-sdk/issues/213

  ```diff
  -await createVersion({ lix, parent: currentVersion })
  +await createVersion({ lix, from: currentVersion })
  ```

- 8629faa: fix: queries against closed database

  closes https://github.com/opral/lix-sdk/issues/226

- de6d717: fix: type mismatch of `file.data`

  The type of `file.data` in `File` interface is changed from `ArrayBuffer` to `Uint8Array` to match the type of `Uint8Array` returned by SQLite and various file related APIs.

  ```diff
  -file.data: ArrayBuffer
  +file.data: Uint8Array
  ```

- be9effa: Extract `toBlob()` from `lix.*` object https://github.com/opral/lix-sdk/issues/196

  ```diff
  - await lix.toBlob()
  + await toBlob({ lix })
  ```

- b74e982: refactor: replace `#*` key syntax with `skip_change_control` column

  closes https://github.com/opral/lix-sdk/issues/191

  Enables matching of flags and avoids re-names of keys. This change replaces the `#*` key syntax with a `skip_change_control` column in the `flags` table.

  ```diff
  key_value = {
  -  key: "#mock_key",
  +  key: "mock_key",
  +  skip_change_control: true,
     value: "mock_value",
  }
  ```

- 5eecc61: refactor: rename `file_id` of own changes from `null` to `lix_sdk` to avoid debugging confusions https://github.com/opral/lix-sdk/issues/194

  ```diff
  - file_id: null
  + file_id: lix_sdk
  ```

## 0.0.1

### Patch Changes

- 400db21: preview of lix

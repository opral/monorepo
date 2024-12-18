# @lix-js/sdk

## 0.0.2

### Patch Changes

- 6b14433: refactor: rename `change_queue` to `file_queue` https://github.com/opral/lix-sdk/issues/168

  ```diff
  -db.selectFrom("change_queue")
  +db.selectFrom("file_queue")
  ```

- 9f1765a: refactor: rename plugin_key: `lix_own_entity` to `lix_own_change_control`

  Closes https://github.com/opral/lix-sdk/issues/197

- fc5a5dd: fix: duplicate version changes

  Closes https://github.com/opral/lix-sdk/issues/217 by making version changes have a unique (entity_id, file_id, schema_key).

  Sync was buggy because the sync process is an async process. A client received multiple version changes for the same entity and inserted them https://github.com/opral/lix-sdk/issues/217#issuecomment-2549545901 without checking if the version change for the entity already exists.

- 8c4ac57: refactor: rename `parent` to `from` in `createVersion()` https://github.com/opral/lix-sdk/issues/213

  ```diff
  -await createVersion({ lix, parent: currentVersion })
  +await createVersion({ lix, from: currentVersion })
  ```

- be9effa: Extract `toBlob()` from `lix.*` object https://github.com/opral/lix-sdk/issues/196

  ```diff
  - await lix.toBlob()
  + await toBlob({ lix })
  ```

- 5eecc61: refactor: rename `file_id` of own changes from `null` to `lix_own_change_control` to avoid debugging confusions https://github.com/opral/lix-sdk/issues/194

  ```diff
  - file_id: null
  + file_id: lix_own_change_control
  ```

## 0.0.1

### Patch Changes

- 400db21: preview of lix

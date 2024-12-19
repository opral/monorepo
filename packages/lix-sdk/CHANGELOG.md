# @lix-js/sdk

## 0.0.2

### Patch Changes

- 85eb03e: refactor: remove `comment.created_at` and `comment.created_by` https://github.com/opral/lix-sdk/issues/175

  Comments and discussions are now change controlled. Hence, knowing when a comment or discussion has been created can be queried via the changes. This removes the need for the `created_at` and `created_by` fields on the `Comment` and `Discussion` entities, and thereby simplifies the schema, avoids duplicate date, and reduces the risk of inconsistencies.

- 2d3ab95: refactor: explicit `firstComment` argument in `createDiscussion()` https://github.com/opral/lix-sdk/issues/164

  It was unclear that the `content` argument in `createDiscussion()` was meant to be the first comment. This change makes it explicit by renaming the argument to `firstComment`.

  ```diff
  - createDiscussion({ discussion, content: "first comment" })
  + createDiscussion({ discussion, firstComment: { content: "first commment" } }})
  ```

- 6b14433: refactor: rename `change_queue` to `file_queue` https://github.com/opral/lix-sdk/issues/168

  ```diff
  -db.selectFrom("change_queue")
  +db.selectFrom("file_queue")
  ```

- 9f1765a: refactor: rename plugin_key: `lix_own_entity` to `lix_own_change_control`

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

- 5eecc61: refactor: rename `file_id` of own changes from `null` to `lix_own_change_control` to avoid debugging confusions https://github.com/opral/lix-sdk/issues/194

  ```diff
  - file_id: null
  + file_id: lix_own_change_control
  ```

## 0.0.1

### Patch Changes

- 400db21: preview of lix

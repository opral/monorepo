[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:24](https://github.com/opral/monorepo/blob/bb6249bc1f353fcb132d1694b6c77522c0283a94/packages/lix-sdk/src/change-set/create-change-set.ts#L24)

Creates a change set with the given changes, optionally within an open transaction.

## Parameters

### args

#### changes

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>[]

#### labels?

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<\{ `id`: `string`; \}\>

## Examples

```ts
  const changes = await lix.db.selectFrom("change").selectAll().execute();
  const changeSet = await createChangeSet({ db: lix.db, changes });
  ```

```ts
  // Create a change set with labels
  const labels = await lix.db.selectFrom("label").selectAll().execute();
  const changeSet = await createChangeSet({
    lix,
    changes: [],
    labels
  });
  ```

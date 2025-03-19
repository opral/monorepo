[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:13](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/change-set/create-change-set.ts#L13)

Creates a change set with the given changes, optionally within an open transaction.

## Parameters

### args

#### changes

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<\{ `id`: `string`; \}\>

## Example

```ts
  const changes = await lix.db.selectFrom("change").selectAll().execute();
  const changeSet = await createChangeSet({ db: lix.db, changes });
  ```

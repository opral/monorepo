[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChange

# Function: createChange()

> **createChange**(`args`): `Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change/create-change.ts:13](https://github.com/opral/monorepo/blob/319d0a05c320245f48086433fd248754def09ccc/packages/lix-sdk/src/change/create-change.ts#L13)

Programatically create a change in the database.

Use this function to directly create a change from a lix app
with bypassing of file-based change detection.

## Parameters

### args

#### authors

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>[]

#### entityId

`string`

#### fileId

`string`

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

#### pluginKey

`string`

#### schemaKey

`string`

#### snapshotContent

`null` \| `Record`\<`string`, `any`\>

## Returns

`Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

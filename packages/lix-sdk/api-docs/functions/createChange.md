[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / createChange

# Function: createChange()

> **createChange**(`args`, `options`?): `Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change/create-change.ts:15](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/change/create-change.ts#L15)

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

#### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

### options?

#### updateVersionChanges?

`boolean`

When true, the version changes will be updated.

Defaults to true.

## Returns

`Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `inherits_from_version_id`: `null` \| `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `name`: `string`; `working_change_set_id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:15](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/version/create-version.ts#L15)

Creates a new version.

The changeSet can be any change set e.g. another version, a checkpoint, etc.

## Parameters

### args

#### changeSet?

`Pick`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; \}, `"id"`\>

#### id?

`string`

#### inherits_from_version_id?

`null` \| `string`

#### lix

[`Lix`](../type-aliases/Lix.md)

#### name?

`string`

## Returns

`Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `inherits_from_version_id`: `null` \| `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `name`: `string`; `working_change_set_id`: `string`; \}\>

## Example

```ts
const version = await createVersion({ lix, changeSet: otherVersion.change_set_id });
```

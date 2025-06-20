[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:6](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/change-set/create-change-set.ts#L6)

## Parameters

### args

#### elements?

`Omit`\<`object` & `object`, `"change_set_id"`\>[]

#### id?

`string`

#### labels?

`Pick`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `name`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### lixcol_version_id?

`string`

Version ID where the change set should be stored. Defaults to active version

#### parents?

`Pick`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; \}, `"id"`\>[]

Parent change sets that this change set will be a child of

## Returns

`Promise`\<`object` & `object`\>

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:7](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/change-set/create-change-set.ts#L7)

## Parameters

### args

#### elements?

`Omit`\<[`NewState`](../type-aliases/NewState.md)\<\{ `change_id`: `string`; `change_set_id`: `string`; `entity_id`: `string`; `file_id`: `string`; `schema_key`: `string`; \}\>, `"change_set_id"`\>[]

#### id?

`string`

#### labels?

`Pick`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### lixcol_version_id?

`string`

Version ID where the change set should be stored. Defaults to active version

#### parents?

`Pick`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `metadata?`: `null` \| `Record`\<`string`, `any`\>; \}, `"id"`\>[]

Parent change sets that this change set will be a child of

## Returns

`Promise`\<`object` & `object`\>

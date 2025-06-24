[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:20](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/change-set/create-change-set.ts#L20)

Creates a change set and optionally attaches elements, labels and parents.

Change sets are the building blocks of versions and checkpoints. This
function inserts all provided relations in a single transaction and
returns the newly created record.

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

## Example

```ts
const cs = await createChangeSet({ lix, elements: [{ change_id, entity_id }] })
```

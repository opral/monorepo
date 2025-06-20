[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createMergeChangeSet

# Function: createMergeChangeSet()

> **createMergeChangeSet**(`args`): `Promise`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-merge-change-set.ts:22](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/change-set/create-merge-change-set.ts#L22)

Merges two change sets using a "source wins" strategy (until lix models conflicts).

Creates a new change set containing the merged result. If an element
(identified by entity_id, file_id, schema_key) exists in both the source
and target change sets (considering their respective histories), the element
from the source change set's history takes precedence.

## Parameters

### args

The arguments for the merge operation.

#### lix

[`Lix`](../type-aliases/Lix.md)

The Lix instance.

#### source

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

The source change set (only `id` is needed).

#### target

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

The target change set (only `id` is needed).

## Returns

`Promise`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; \}\>

A Promise resolving to the newly created ChangeSet representing the merged state.

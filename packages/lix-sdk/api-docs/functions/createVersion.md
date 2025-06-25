[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `change_set_id`: `string`; `hidden?`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`undefined` \| `boolean`\>; `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `inherits_from_version_id?`: `string` & `object`; `name`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `working_change_set_id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:15](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/version/create-version.ts#L15)

Creates a new version.

The changeSet can be any change set e.g. another version, a checkpoint, etc.

## Parameters

### args

#### changeSet?

`Pick`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `metadata?`: `null` \| `Record`\<`string`, `any`\>; \}, `"id"`\>

#### id?

[`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>

#### inherits_from_version_id?

`string` & `object`

#### lix

[`Lix`](../type-aliases/Lix.md)

#### name?

[`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>

## Returns

`Promise`\<\{ `change_set_id`: `string`; `hidden?`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`undefined` \| `boolean`\>; `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `inherits_from_version_id?`: `string` & `object`; `name`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `working_change_set_id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; \}\>

## Example

```ts
const version = await createVersion({ lix, changeSet: otherVersion.change_set_id });
```

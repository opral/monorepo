[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `name`: `null` \| `string`; `working_change_set_id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:14](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/version/create-version.ts#L14)

Creates a new version.

The changeSet can be any change set e.g. another version, a checkpoint, etc.

## Parameters

### args

#### changeSet

`Pick`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}, `"id"`\>

#### id?

`string`

#### lix

[`Lix`](../type-aliases/Lix.md)

#### name?

`null` \| `string`

## Returns

`Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `name`: `null` \| `string`; `working_change_set_id`: `string`; \}\>

## Example

```ts
const version = await createVersion({ lix, changeSet: otherVersion.change_set_id });
```

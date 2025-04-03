[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / updateChangesInVersion

# Function: updateChangesInVersion()

> **updateChangesInVersion**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/version/update-changes-in-version.ts:10](https://github.com/opral/monorepo/blob/e56b872498d48e57574f781e8cd2e240c1f6f0b2/packages/lix-sdk/src/version/update-changes-in-version.ts#L10)

Updates the changes that are part of a version.

This function will update the change_set_element table to point to the new changes.

## Parameters

### args

#### changes

`object`[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

#### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`Promise`\<`void`\>

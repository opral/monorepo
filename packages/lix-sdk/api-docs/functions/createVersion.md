[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:23](https://github.com/opral/monorepo/blob/c1910f74abb6a0c11c72843e559a3503d21f8bdb/packages/lix-sdk/src/version/create-version.ts#L23)

Creates a new Version.

If `from` is provided, the new version will be identical to the from version.

## Parameters

### args

#### from?

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### name?

`string`

## Returns

`Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

## Examples

_Without from_

  ```ts
  const version = await createVersion({ lix });
  ```

_With from_

  ```ts
  const version = await createVersion({ lix, from: otherVersion });
  ```

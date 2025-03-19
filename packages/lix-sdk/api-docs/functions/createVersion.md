[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:23](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/version/create-version.ts#L23)

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

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / switchVersion

# Function: switchVersion()

> **switchVersion**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/version/switch-version.ts:27](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/version/switch-version.ts#L27)

Switches the current Version to the given Version.

The Version must already exist before calling this function.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"plugin"`\>

#### to

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`Promise`\<`void`\>

## Examples

```ts
  await switchVersion({ lix, to: otherVersion });
  ```

Switching Versiones to a newly created Version.

  ```ts
  await lix.db.transaction().execute(async (trx) => {
     const newVersion = await createVersion({ lix: { db: trx }, parent: currentVersion });
     await switchVersion({ lix: { db: trx }, to: newVersion });
  });
  ```

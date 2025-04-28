[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLeafInVersion

# Function: changeIsLeafInVersion()

> **changeIsLeafInVersion**(`version`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts:16](https://github.com/opral/monorepo/blob/bb6249bc1f353fcb132d1694b6c77522c0283a94/packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts#L16)

Selects changes that are not a parent of any other change within the specified version.

## Parameters

### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeafInVersion(currentVersion))
    .selectAll()
    .execute();
  ```

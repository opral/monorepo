[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / changeIsLeafInVersion

# Function: changeIsLeafInVersion()

> **changeIsLeafInVersion**(`version`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts:16](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts#L16)

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

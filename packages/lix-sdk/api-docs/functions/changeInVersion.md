[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / changeInVersion

# Function: changeInVersion()

> **changeInVersion**(`version`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-in-version.ts:16](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/query-filter/change-in-version.ts#L16)

Filters if a change is in the given Version.

## Parameters

### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  const changes = await lix.db.selectFrom("change")
     .where(changeInVersion(currentVersion))
     .selectAll()
     .execute();
  ```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / changeIsLeafOf

# Function: changeIsLeafOf()

> **changeIsLeafOf**(`change`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf-of.ts:29](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/query-filter/change-is-leaf-of.ts#L29)

Filter to select the last descendant of the specified change.

## Parameters

### change

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Examples

Checking for the leaf of a change in all versiones.

  ```ts
  await lix.db.selectFrom("change")
     .where(changeIsLeafOf(someChange))
     .selectAll()
     .execute();
  ```

Checking for the leaf of a change in a specific version.

  ```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeafOf(someChange))
    .where(changeInVersion(someVersion))
    .selectAll()
    .execute();
  ```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeHasLabel

# Function: changeHasLabel()

> **changeHasLabel**(`label`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-has-label.ts:25](https://github.com/opral/monorepo/blob/e7cabbd11b2cf40d5b5e9666e006c5433c18e5da/packages/lix-sdk/src/query-filter/change-has-label.ts#L25)

Selects changes that have a label with the given name.

## Parameters

### label

\{ `id`: `string`; `name?`: `string`; \} | \{ `id?`: `string`; `name`: `string`; \}

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Examples

```ts
  await lix.db.selectFrom("change")
     .where(changeHasLabel({ name: "checkpoint" }))
     .selectAll()
     .execute();
  ```

You can use eb.not() to negate the filter.

  ```ts
  await lix.db.selectFrom("change")
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint"})))
		.selectAll()
		.execute();
  ```

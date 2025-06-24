[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixGenerated

# Type Alias: LixGenerated\<T\>

> **LixGenerated**\<`T`\> = `T` & `object`

Defined in: [packages/lix-sdk/src/schema-definition/definition.ts:202](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/schema-definition/definition.ts#L202)

Marker type for database columns that are auto-generated.

This type brands values as "generated" to enable special handling in insert/update
operations. Generated fields become optional in inserts since the database
provides default values.

The type accepts T values directly for developer convenience while preserving
the generated marker for type transformations.

## Type declaration

### \_\_lixGenerated?

> `readonly` `optional` **\_\_lixGenerated**: `true`

## Type Parameters

### T

`T`

## Example

```typescript
type Account = {
  id: LixGenerated<string>;  // Auto-generated UUID
  name: string;              // User-provided
  created_at: LixGenerated<string>;  // Auto-generated timestamp
};

// In inserts, generated fields are optional
const newAccount: LixInsertable<Account> = {
  name: "John"  // id and created_at are optional
};
```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixInsertable

# Type Alias: LixInsertable\<T\>

> **LixInsertable**\<`T`\> = `{ [K in NonNullableInsertKeys<T>]: InsertType<T[K]> }` & `{ [K in NullableInsertKeys<T>]?: InsertType<T[K]> }`

Defined in: [packages/lix-sdk/src/schema-definition/definition.ts:293](https://github.com/opral/monorepo/blob/3025726c2bce8185b41ef0b1b2f7cc069ebcf2b0/packages/lix-sdk/src/schema-definition/definition.ts#L293)

Transform a type for insert operations.

This type makes LixGenerated fields optional while keeping other required
fields mandatory. Use this when defining types for creating new entities.

The database will automatically populate generated fields (like IDs,
timestamps) if not provided.

## Type Parameters

### T

`T`

## Example

```typescript
type Account = {
  id: LixGenerated<string>;
  name: string;
  email: string;
  created_at: LixGenerated<string>;
};

type NewAccount = LixInsertable<Account>;
// Result: { name: string; email: string; id?: string; created_at?: string; }

const account: NewAccount = {
  name: "John",
  email: "john@example.com"
  // id and created_at are optional
};
```

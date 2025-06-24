[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixSelectable

# Type Alias: LixSelectable\<T\>

> **LixSelectable**\<`T`\> = `{ [K in keyof T]: SelectType<T[K]> }`

Defined in: [packages/lix-sdk/src/schema-definition/definition.ts:363](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/schema-definition/definition.ts#L363)

Transform a type for select/query operations.

This type unwraps all LixGenerated markers, giving you the actual runtime
types that will be returned from database queries. All fields are required
and have their base types.

Use this type when defining the shape of data returned from queries or
when passing entity data to UI components.

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

type AccountData = LixSelectable<Account>;
// Result: { id: string; name: string; email: string; created_at: string; }

// Query results have this shape
const accounts: AccountData[] = await db
  .selectFrom("account")
  .selectAll()
  .execute();

console.log(accounts[0].id);  // string (not LixGenerated<string>)
```

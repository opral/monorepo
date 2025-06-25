[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixUpdateable

# Type Alias: LixUpdateable\<T\>

> **LixUpdateable**\<`T`\> = `{ [K in keyof T]?: UpdateType<T[K]> }`

Defined in: [packages/lix-sdk/src/schema-definition/definition.ts:328](https://github.com/opral/monorepo/blob/e7cabbd11b2cf40d5b5e9666e006c5433c18e5da/packages/lix-sdk/src/schema-definition/definition.ts#L328)

Transform a type for update operations.

This type makes all fields optional, allowing partial updates where you
only specify the fields you want to change. LixGenerated markers are
removed since you're providing explicit values.

The database preserves existing values for any fields not included
in the update.

## Type Parameters

### T

`T`

## Example

```typescript
type Account = {
  id: LixGenerated<string>;
  name: string;
  email: string;
  updated_at: LixGenerated<string>;
};

type AccountUpdate = LixUpdateable<Account>;
// Result: { id?: string; name?: string; email?: string; updated_at?: string; }

// Update only the email
const updates: AccountUpdate = {
  email: "newemail@example.com"
  // Other fields remain unchanged
};
```

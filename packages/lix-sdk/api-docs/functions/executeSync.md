[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / executeSync

# Function: executeSync()

> **executeSync**(`args`): `any`[]

Defined in: [packages/lix-sdk/src/database/execute-sync.ts:15](https://github.com/opral/monorepo/blob/c1910f74abb6a0c11c72843e559a3503d21f8bdb/packages/lix-sdk/src/database/execute-sync.ts#L15)

Execute a query synchronously.

WARNING: This function is not recommended for general use.
Only if you need sync queries, like in a trigger for exmaple,
you should use this function. The function is not transforming
the query or the result as the db API does. You get raw SQL.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"sqlite"`\>

#### query

`any`

## Returns

`any`[]

## Example

```ts
const query = lix.db.selectFrom("key_value").selectAll();
  const result = executeSync({ lix, query }) as KeyValue[];
```

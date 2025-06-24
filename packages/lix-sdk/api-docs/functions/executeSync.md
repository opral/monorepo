[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / executeSync

# Function: executeSync()

> **executeSync**(`args`): `any`[]

Defined in: [packages/lix-sdk/src/database/execute-sync.ts:21](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/database/execute-sync.ts#L21)

Execute a query synchronously.

⚠️  MAJOR WARNING: This function is a PURE SQL LAYER without transformations!

- JSON columns return as RAW JSON STRINGS, not parsed objects
- You must manually parse/stringify JSON data
- No automatic type conversions happen
- Results are raw SQLite values

Only use this for triggers, database functions, or when you specifically
need synchronous database access and understand you're working with raw SQL.

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
// JSON columns are returned as strings - you must parse manually:
  const result = executeSync({ lix, query });
  result[0].metadata = JSON.parse(result[0].metadata);
```

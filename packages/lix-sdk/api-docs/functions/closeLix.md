[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / closeLix

# Function: closeLix()

> **closeLix**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/lix/close-lix.ts:15](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/lix/close-lix.ts#L15)

Destroys the underlying database connection.

After closing the Lix instance all subsequent operations on it
will fail. Call this when your application no longer needs access
to the file.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
await closeLix({ lix })
```

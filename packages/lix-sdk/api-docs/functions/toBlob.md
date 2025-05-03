[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / toBlob

# Function: toBlob()

> **toBlob**(`args`): `Promise`\<`Blob`\>

Defined in: [packages/lix-sdk/src/lix/to-blob.ts:10](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/lix/to-blob.ts#L10)

Convert the lix to a blob.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

## Returns

`Promise`\<`Blob`\>

## Example

```ts
const blob = await toBlob({ lix })
```

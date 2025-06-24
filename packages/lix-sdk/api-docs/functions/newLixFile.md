[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / newLixFile

# Function: newLixFile()

> **newLixFile**(): `Promise`\<`Blob`\>

Defined in: [packages/lix-sdk/src/lix/new-lix.ts:44](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/lix/new-lix.ts#L44)

Returns a new empty Lix file as a Blob.

The function bootstraps an in‑memory SQLite database with all
required tables, change sets and metadata so that it represents
a valid Lix project. The caller is responsible for persisting the
resulting blob to disk, IndexedDB or any other storage location.

## Returns

`Promise`\<`Blob`\>

## Example

```ts
const blob = await newLixFile()
await saveToDisk(blob)
```

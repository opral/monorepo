[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / newLixFile

# Function: newLixFile()

> **newLixFile**(): `Promise`\<`Blob`\>

Defined in: [packages/lix-sdk/src/lix/new-lix.ts:44](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/lix/new-lix.ts#L44)

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

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileTable

# Type Alias: LixFileTable

> **LixFileTable** = `object`

Defined in: [packages/lix-sdk/src/file/database-schema.ts:37](https://github.com/opral/monorepo/blob/95d464500b14a3c0aabc535935d800ebcc86d1ad/packages/lix-sdk/src/file/database-schema.ts#L37)

## Properties

### data

> **data**: `Uint8Array`

Defined in: [packages/lix-sdk/src/file/database-schema.ts:49](https://github.com/opral/monorepo/blob/95d464500b14a3c0aabc535935d800ebcc86d1ad/packages/lix-sdk/src/file/database-schema.ts#L49)

***

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/database-schema.ts:38](https://github.com/opral/monorepo/blob/95d464500b14a3c0aabc535935d800ebcc86d1ad/packages/lix-sdk/src/file/database-schema.ts#L38)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\> \| `null`

Defined in: [packages/lix-sdk/src/file/database-schema.ts:50](https://github.com/opral/monorepo/blob/95d464500b14a3c0aabc535935d800ebcc86d1ad/packages/lix-sdk/src/file/database-schema.ts#L50)

***

### path

> **path**: `string`

Defined in: [packages/lix-sdk/src/file/database-schema.ts:48](https://github.com/opral/monorepo/blob/95d464500b14a3c0aabc535935d800ebcc86d1ad/packages/lix-sdk/src/file/database-schema.ts#L48)

The path of the file.

The path is currently defined as a subset of RFC 3986.
Any path can be tested with the `isValidFilePath()` function.

#### Example

```ts
- `/path/to/file.txt`
```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileHistoryView

# Type Alias: LixFileHistoryView

> **LixFileHistoryView** = `object` & `StateEntityHistoryView`

Defined in: [packages/lix-sdk/src/file/schema.ts:322](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L322)

## Type declaration

### data

> **data**: `Uint8Array`

### id

> **id**: `Generated`\<`string`\>

### metadata

> **metadata**: `Record`\<`string`, `any`\> \| `null`

### path

> **path**: `string`

The path of the file.

The path is currently defined as a subset of RFC 3986.
Any path can be tested with the `isValidFilePath()` function.

#### Example

```ts
- `/path/to/file.txt`
```

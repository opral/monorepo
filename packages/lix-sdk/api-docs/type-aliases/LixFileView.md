[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileView

# Type Alias: LixFileView

> **LixFileView** = `object`

Defined in: [packages/lix-sdk/src/file/schema.ts:281](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L281)

## Properties

### data

> **data**: `Uint8Array`

Defined in: [packages/lix-sdk/src/file/schema.ts:293](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L293)

***

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:282](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L282)

***

### lixcol\_created\_at

> **lixcol\_created\_at**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:296](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L296)

***

### lixcol\_inherited\_from\_version\_id

> **lixcol\_inherited\_from\_version\_id**: `Generated`\<`string` \| `null`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:295](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L295)

***

### lixcol\_updated\_at

> **lixcol\_updated\_at**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:297](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L297)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\> \| `null`

Defined in: [packages/lix-sdk/src/file/schema.ts:294](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L294)

***

### path

> **path**: `string`

Defined in: [packages/lix-sdk/src/file/schema.ts:292](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L292)

The path of the file.

The path is currently defined as a subset of RFC 3986.
Any path can be tested with the `isValidFilePath()` function.

#### Example

```ts
- `/path/to/file.txt`
```

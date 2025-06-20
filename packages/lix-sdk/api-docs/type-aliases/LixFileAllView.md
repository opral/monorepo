[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileAllView

# Type Alias: LixFileAllView

> **LixFileAllView** = `object`

Defined in: [packages/lix-sdk/src/file/schema.ts:301](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L301)

## Properties

### data

> **data**: `Uint8Array`

Defined in: [packages/lix-sdk/src/file/schema.ts:313](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L313)

***

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:302](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L302)

***

### lixcol\_created\_at

> **lixcol\_created\_at**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:317](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L317)

***

### lixcol\_inherited\_from\_version\_id

> **lixcol\_inherited\_from\_version\_id**: `Generated`\<`string` \| `null`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:316](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L316)

***

### lixcol\_updated\_at

> **lixcol\_updated\_at**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:318](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L318)

***

### lixcol\_version\_id

> **lixcol\_version\_id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/file/schema.ts:315](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L315)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\> \| `null`

Defined in: [packages/lix-sdk/src/file/schema.ts:314](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L314)

***

### path

> **path**: `string`

Defined in: [packages/lix-sdk/src/file/schema.ts:312](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L312)

The path of the file.

The path is currently defined as a subset of RFC 3986.
Any path can be tested with the `isValidFilePath()` function.

#### Example

```ts
- `/path/to/file.txt`
```

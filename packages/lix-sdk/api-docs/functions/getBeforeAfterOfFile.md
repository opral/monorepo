[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / getBeforeAfterOfFile

# Function: getBeforeAfterOfFile()

> **getBeforeAfterOfFile**(`args`): `Promise`\<\{ `after?`: \{ `data`: `Uint8Array`\<`ArrayBufferLike`\>; `id`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; `path`: `string`; \}; `before?`: \{ `data`: `Uint8Array`\<`ArrayBufferLike`\>; `id`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; `path`: `string`; \}; \}\>

Defined in: [packages/lix-sdk/src/change-set/get-before-after-of-file.ts:29](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/change-set/get-before-after-of-file.ts#L29)

Interim utility function until https://github.com/opral/lix-sdk/issues/252 arrives.

Use this function to get the file contents before and after for diffing purposes.

## Parameters

### args

#### changeSetAfter?

`Pick`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}, `"id"`\>

#### changeSetBefore?

`Pick`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}, `"id"`\>

#### file

`Pick`\<\{ `data`: `Uint8Array`\<`ArrayBufferLike`\>; `id`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; `path`: `string`; \}, `"id"`\>

#### lix

[`Lix`](../type-aliases/Lix.md)

## Returns

`Promise`\<\{ `after?`: \{ `data`: `Uint8Array`\<`ArrayBufferLike`\>; `id`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; `path`: `string`; \}; `before?`: \{ `data`: `Uint8Array`\<`ArrayBufferLike`\>; `id`: `string`; `metadata`: `null` \| `Record`\<`string`, `any`\>; `path`: `string`; \}; \}\>

## Example

```ts
const { before, after } = await diffForFile({
    lix,
    changeSetBefore,
    changeSetAfter,
    file: { id: "XYZ" },
  });

  console.log("Before:", before);
  console.log("After:", after);

  renderDiff(before, after);
```

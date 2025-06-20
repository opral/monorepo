[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixPlugin

# Type Alias: LixPlugin

> **LixPlugin** = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:7](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L7)

## Properties

### applyChanges()?

> `optional` **applyChanges**: (`{
		file,
		changes,
	}`) => `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:34](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L34)

#### Parameters

##### \{
		file,
		changes,
	\}

###### changes

[`Change`](Change.md) & `object`[]

###### file

[`LixFileType`](LixFileType.md) & `object`

The file to which the changes should be applied.

The `file.data` might be undefined if the file does not
exist at the time of applying the changes. This can
happen when merging a version that created a new file
that did not exist in the target version. Or, a file
has been deleted and should be restored at a later point.

#### Returns

`object`

##### fileData

> **fileData**: `Uint8Array`

***

### detectChanges()?

> `optional` **detectChanges**: (`{
		before,
		after,
	}`) => [`DetectedChange`](DetectedChange.md)[]

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:27](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L27)

Detects changes between the `before` and `after` file update(s).

`Before` is `undefined` if the file did not exist before (
the file was created).

`After` is always defined. Either the file was updated, or
deleted. If the file is deleted, lix own change control
will handle the deletion. Hence, `after` is always be defined.

#### Parameters

##### \{
		before,
		after,
	\}

###### after

[`LixFileType`](LixFileType.md) & `object`

###### before?

[`LixFileType`](LixFileType.md) & `object`

#### Returns

[`DetectedChange`](DetectedChange.md)[]

***

### detectChangesGlob?

> `optional` **detectChangesGlob**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:16](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L16)

The glob pattern that should invoke `detectChanges()`.

#### Example

```ts
`**/*.json` for all JSON files
  `**/*.inlang` for all inlang files
```

***

### diffUiComponent?

> `optional` **diffUiComponent**: `CustomElementConstructor`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:53](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L53)

UI components that are used to render the diff view.

***

### key

> **key**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:8](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/lix-plugin.ts#L8)

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / LixPlugin

# Type Alias: LixPlugin

> **LixPlugin** = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:9](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L9)

## Properties

### applyChanges()?

> `optional` **applyChanges**: (`args`) => `Promise`\<\{ `fileData`: [`LixFile`](LixFile.md)\[`"data"`\]; \}\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:45](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L45)

#### Parameters

##### args

###### changes

[`Change`](Change.md)[]

###### file

`Omit`\<[`LixFile`](LixFile.md), `"data"`\> & `object`

The file to which the changes should be applied.

The `file.data` might be undefined if the file does not
exist at the time of applying the changes. This can
happen when merging a version that created a new file
that did not exist in the target version. Or, a file
has been deleted and should be restored at a later point.

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<\{ `fileData`: [`LixFile`](LixFile.md)\[`"data"`\]; \}\>

***

### detectChanges()?

> `optional` **detectChanges**: (`args`) => `Promise`\<[`DetectedChange`](DetectedChange.md)[]\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:29](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L29)

Detects changes between the `before` and `after` file update(s).

`Before` is `undefined` if the file did not exist before (
the file was created).

`After` is always defined. Either the file was updated, or
deleted. If the file is deleted, lix own change control
will handle the deletion. Hence, `after` is always be defined.

#### Parameters

##### args

###### after

[`LixFile`](LixFile.md)

###### before?

[`LixFile`](LixFile.md)

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<[`DetectedChange`](DetectedChange.md)[]\>

***

### detectChangesGlob?

> `optional` **detectChangesGlob**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:18](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L18)

The glob pattern that should invoke `detectChanges()`.

#### Example

```ts
`**/*.json` for all JSON files
  `**/*.inlang` for all inlang files
```

***

### detectConflicts()?

> `optional` **detectConflicts**: (`args`) => `Promise`\<[`DetectedConflict`](DetectedConflict.md)[]\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:41](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L41)

Detects changes from the source lix that conflict with changes in the target lix.

#### Parameters

##### args

###### changes

[`Change`](Change.md)[]

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<[`DetectedConflict`](DetectedConflict.md)[]\>

***

### diffUiComponent?

> `optional` **diffUiComponent**: `CustomElementConstructor`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:37](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L37)

UI components that are used to render the diff view.

***

### key

> **key**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:10](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/plugin/lix-plugin.ts#L10)

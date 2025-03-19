[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / DetectedChange

# Type Alias: DetectedChange\<Schema\>

> **DetectedChange**\<`Schema`\> = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:97](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/plugin/lix-plugin.ts#L97)

A detected change that lix ingests in to the database.

- If the `snapshot` is `undefined`, the change is considered to be a deletion.
- The `schema` type can be narrowed by providing a change schema.

## Example

Type narrowing with a change schema:

  ```
	 const FooV1Schema = {
    key: "plugin-name-foo-v1",
    type: "json",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
		   }
    }
  } as const satisfies ChangeSchema;

  const detectedChange: DetectedChange<typeof FooV1Schema>

  detectedChange.snapshot.name // string
  ```

## Type Parameters

### Schema

`Schema` *extends* [`ExperimentalChangeSchema`](ExperimentalChangeSchema.md) = `any`

## Properties

### entity\_id

> **entity\_id**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:98](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/plugin/lix-plugin.ts#L98)

***

### schema

> **schema**: `Omit`\<[`ExperimentalChangeSchema`](ExperimentalChangeSchema.md), `"schema"`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:99](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/plugin/lix-plugin.ts#L99)

***

### snapshot?

> `optional` **snapshot**: [`ExperimentalInferType`](ExperimentalInferType.md)\<`Schema`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:104](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/plugin/lix-plugin.ts#L104)

The change is considered a deletion if `snapshot` is `undefined`.

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / DetectedChange

# Type Alias: DetectedChange\<Schema\>

> **DetectedChange**\<`Schema`\> = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:98](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/plugin/lix-plugin.ts#L98)

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

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:99](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/plugin/lix-plugin.ts#L99)

***

### schema

> **schema**: `Omit`\<[`ExperimentalChangeSchema`](ExperimentalChangeSchema.md), `"schema"`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:100](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/plugin/lix-plugin.ts#L100)

***

### snapshot?

> `optional` **snapshot**: [`ExperimentalInferType`](ExperimentalInferType.md)\<`Schema`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:105](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/plugin/lix-plugin.ts#L105)

The change is considered a deletion if `snapshot` is `undefined`.

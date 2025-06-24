[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFile

# Type Alias: LixFile

> **LixFile** = [`FromLixSchemaDefinition`](FromLixSchemaDefinition.md)\<*typeof* [`LixFileSchema`](../variables/LixFileSchema.md)\> & `object`

Defined in: [packages/lix-sdk/src/file/schema.ts:277](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/file/schema.ts#L277)

Pure business logic type inferred from the LixFileSchema.

Uses "Type" suffix to avoid collision with JavaScript's built-in File type,
while maintaining consistency with our naming pattern where schema-derived
types represent the pure business logic without database infrastructure columns.

## Type declaration

### data

> **data**: `Uint8Array`

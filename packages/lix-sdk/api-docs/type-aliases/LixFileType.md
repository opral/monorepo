[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileType

# Type Alias: LixFileType

> **LixFileType** = [`FromLixSchemaDefinition`](FromLixSchemaDefinition.md)\<*typeof* [`LixFileSchema`](../variables/LixFileSchema.md)\>

Defined in: [packages/lix-sdk/src/file/schema.ts:278](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/file/schema.ts#L278)

Pure business logic type inferred from the LixFileSchema.

Uses "Type" suffix to avoid collision with JavaScript's built-in File type,
while maintaining consistency with our naming pattern where schema-derived
types represent the pure business logic without database infrastructure columns.

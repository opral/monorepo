[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileType

# Type Alias: LixFileType

> **LixFileType** = [`FromLixSchemaDefinition`](FromLixSchemaDefinition.md)\<*typeof* [`LixFileSchema`](../variables/LixFileSchema.md)\>

Defined in: [packages/lix-sdk/src/file/schema.ts:237](https://github.com/opral/monorepo/blob/0501d8fe7eed9db1f8058e8d1d58b1d613ceaf43/packages/lix-sdk/src/file/schema.ts#L237)

Pure business logic type inferred from the LixFileSchema.

Uses "Type" suffix to avoid collision with JavaScript's built-in File type,
while maintaining consistency with our naming pattern where schema-derived
types represent the pure business logic without database infrastructure columns.

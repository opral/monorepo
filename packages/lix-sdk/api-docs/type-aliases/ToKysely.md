[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ToKysely

# Type Alias: ToKysely\<T\>

> **ToKysely**\<`T`\> = `{ [K in keyof T]: IsLixGenerated<T[K]> extends true ? KyselyGenerated<SelectType<T[K]>> : T[K] }`

Defined in: [packages/lix-sdk/src/entity-views/types.ts:34](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/entity-views/types.ts#L34)

Convert our LixGenerated types to Kysely's Generated types.
This adapter is used at the database boundary.

## Type Parameters

### T

`T`

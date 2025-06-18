[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:9](https://github.com/opral/monorepo/blob/0501d8fe7eed9db1f8058e8d1d58b1d613ceaf43/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L9)

Opens a lix in memory.

## Parameters

### args

`object` & `Omit`\<\{ `account?`: \{ `id`: `string`; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues?`: `object` & `object`[]; `providePlugins?`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

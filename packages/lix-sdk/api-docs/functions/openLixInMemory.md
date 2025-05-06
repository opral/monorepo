[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:8](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L8)

Opens a lix in memory.

## Parameters

### args

`object` & `Omit`\<\{ `account?`: \{ `id`: `string`; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues?`: `object` & `object`[]; `providePlugins?`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

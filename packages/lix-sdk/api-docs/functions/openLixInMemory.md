[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:8](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L8)

Opens a lix in memory.

## Parameters

### args

`object` & `Omit`\<\{ `account`: \{ `id`: `string`; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues`: `object` & `object`[]; `providePlugins`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

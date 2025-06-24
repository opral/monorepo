[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:9](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L9)

Opens a lix in memory.

## Parameters

### args

`object` & `Omit`\<\{ `account?`: \{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues?`: [`NewState`](../type-aliases/NewState.md)\<[`KeyValue`](../type-aliases/KeyValue.md)\>[]; `providePlugins?`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

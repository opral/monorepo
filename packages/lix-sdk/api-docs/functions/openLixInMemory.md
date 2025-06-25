[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:17](https://github.com/opral/monorepo/blob/3025726c2bce8185b41ef0b1b2f7cc069ebcf2b0/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L17)

Loads a Lix file into a temporary in‑memory database.

The returned instance behaves like [openLix](openLix.md) but keeps all
data only for the lifetime of the current JavaScript context. If no
blob is provided a fresh Lix project is created automatically.

## Parameters

### args

`object` & `Omit`\<\{ `account?`: \{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues?`: [`NewState`](../type-aliases/NewState.md)\<[`KeyValue`](../type-aliases/KeyValue.md)\>[]; `providePlugins?`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

## Example

```ts
const lix = await openLixInMemory({})
```

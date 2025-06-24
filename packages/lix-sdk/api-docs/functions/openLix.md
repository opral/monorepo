[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLix

# Function: openLix()

> **openLix**(`args`): `Promise`\<[`Lix`](../type-aliases/Lix.md)\>

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:35](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/lix/open-lix.ts#L35)

Common setup between different lix environments.

## Parameters

### args

#### account?

\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}

The account that is opening this lix.

Lix will automatically set the active account to the provided account.

**Example**

```ts
const account = localStorage.getItem("account")
  const lix = await openLix({ account })
```

#### account.id

[`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>

#### account.name

`string`

#### database

`SqliteWasmDatabase`

#### keyValues?

[`NewState`](../type-aliases/NewState.md)\<[`KeyValue`](../type-aliases/KeyValue.md)\>[]

Set the key values when opening the lix.

**Example**

```ts
const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
```

#### providePlugins?

[`LixPlugin`](../type-aliases/LixPlugin.md)[]

Usecase are lix apps that define their own file format,
like inlang (unlike a markdown, csv, or json plugin).

(+) avoids separating app code from plugin code and
    resulting bundling logic.

(-) such a file format must always be opened with the
    file format sdk. the file is not portable

**Example**

```ts
const lix = await openLixInMemory({ providePlugins: [myPlugin] })
```

## Returns

`Promise`\<[`Lix`](../type-aliases/Lix.md)\>

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createAccount

# Function: createAccount()

> **createAccount**(`args`): `Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/account/create-account.ts:18](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/account/create-account.ts#L18)

Inserts a new account into the Lix database.

Accounts represent different identities working with the same Lix
file. Switching the active account is handled separately via
[switchAccount](switchAccount.md).

## Parameters

### args

#### id?

[`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### lixcol_version_id?

`string`

#### name

`string`

## Returns

`Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}\>

## Example

```ts
const account = await createAccount({ lix, name: "Jane" })
```

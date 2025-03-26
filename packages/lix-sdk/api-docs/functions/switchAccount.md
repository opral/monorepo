[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / switchAccount

# Function: switchAccount()

> **switchAccount**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/account/switch-account.ts:23](https://github.com/opral/monorepo/blob/b171e3e71d4461028abf991c33609fbcfb064d33/packages/lix-sdk/src/account/switch-account.ts#L23)

Switch the current account to the provided account.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### to

`object`[]

## Returns

`Promise`\<`void`\>

## Examples

One active account

  ```ts
  await switchAccount({ lix, to: [otherAccount] });
  ```

Multiple active accounts

  ```ts
  await switchAccount({ lix, to: [account1, account2] });
  ```

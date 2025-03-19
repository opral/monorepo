[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / withSkipOwnChangeControl

# Function: withSkipOwnChangeControl()

> **withSkipOwnChangeControl**\<`T`\>(`db`, `operation`): `Promise`\<`T`\>

Defined in: [packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts:3](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts#L3)

## Type Parameters

### T

`T`

## Parameters

### db

`Kysely`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md)\>

### operation

(`trx`) => `Promise`\<`T`\>

## Returns

`Promise`\<`T`\>

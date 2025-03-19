[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / withSkipOwnChangeControl

# Function: withSkipOwnChangeControl()

> **withSkipOwnChangeControl**\<`T`\>(`db`, `operation`): `Promise`\<`T`\>

Defined in: [packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts:3](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts#L3)

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

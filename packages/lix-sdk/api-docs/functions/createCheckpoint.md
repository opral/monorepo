[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createCheckpoint

# Function: createCheckpoint()

> **createCheckpoint**(`args`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-checkpoint.ts:17](https://github.com/opral/monorepo/blob/e7cabbd11b2cf40d5b5e9666e006c5433c18e5da/packages/lix-sdk/src/change-set/create-checkpoint.ts#L17)

Converts the current working change set into a checkpoint.

The working change set becomes immutable and receives the
`checkpoint` label. A fresh empty working change set is created so
that new changes can continue to accumulate.

## Parameters

### args

#### lix

[`Lix`](../type-aliases/Lix.md)

## Returns

`Promise`\<\{ `id`: `string`; \}\>

## Example

```ts
const { id } = await createCheckpoint({ lix })
```

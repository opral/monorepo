[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createCheckpoint

# Function: createCheckpoint()

> **createCheckpoint**(`args`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-checkpoint.ts:17](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/change-set/create-checkpoint.ts#L17)

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

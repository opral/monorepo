[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createCheckpoint

# Function: createCheckpoint()

> **createCheckpoint**(`args`): `Promise`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-checkpoint.ts:5](https://github.com/opral/monorepo/blob/985ffce1eb6542fd7d2a659b02ab83cb2ccd8d57/packages/lix-sdk/src/change-set/create-checkpoint.ts#L5)

## Parameters

### args

#### lix

[`Lix`](../type-aliases/Lix.md)

#### version?

`Pick`\<\{ `change_set_id`: `string`; `id`: `string`; `name`: `null` \| `string`; `working_change_set_id`: `string`; \}, `"id"`\>

Optional version to create checkpoint from.

**Default**

```ts
The active version
```

## Returns

`Promise`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}\>

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / applyChangeSet

# Function: applyChangeSet()

> **applyChangeSet**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/change-set/apply-change-set.ts:15](https://github.com/opral/monorepo/blob/985ffce1eb6542fd7d2a659b02ab83cb2ccd8d57/packages/lix-sdk/src/change-set/apply-change-set.ts#L15)

Applies a change set to the lix.

## Parameters

### args

#### changeSet

`Pick`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}, `"id"`\>

#### lix

[`Lix`](../type-aliases/Lix.md)

#### mode?

[`GraphTraversalMode`](../type-aliases/GraphTraversalMode.md)

The [GraphTraversalMode](../type-aliases/GraphTraversalMode.md) for applying the change set.

**Default**

```ts
"recursive"
```

#### updateVersion?

`boolean`

Whether to update the version to point to the new change set.

**Default**

```ts
true
```

#### version?

`Pick`\<\{ `change_set_id`: `string`; `id`: `string`; `name`: `null` \| `string`; `working_change_set_id`: `string`; \}, `"id"` \| `"change_set_id"`\>

## Returns

`Promise`\<`void`\>

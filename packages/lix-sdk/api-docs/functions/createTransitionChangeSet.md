[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createTransitionChangeSet

# Function: createTransitionChangeSet()

> **createTransitionChangeSet**(`args`): `Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `metadata?`: `null` \| `Record`\<`string`, `any`\>; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-transition-change-set.ts:17](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/change-set/create-transition-change-set.ts#L17)

Creates a change set that enables a transition from a source state
(defined by `sourceChangeSet`) to a target state (defined by `targetChangeSet`).

Applying the returned change set to the source state will result in a state
that matches the target state.

- switch between state (switching versions, checkpoints, etc.)
- restore old state (applying the transition set on top of current state)

## Parameters

### args

#### lix

[`Lix`](../type-aliases/Lix.md)

#### sourceChangeSet

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

#### targetChangeSet

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

## Returns

`Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `metadata?`: `null` \| `Record`\<`string`, `any`\>; \}\>

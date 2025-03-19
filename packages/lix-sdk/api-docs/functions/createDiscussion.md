[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / createDiscussion

# Function: createDiscussion()

> **createDiscussion**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/discussion/create-discussion.ts:15](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/discussion/create-discussion.ts#L15)

Creates a new discussion with the first comment.

## Parameters

### args

#### changeSet

`Pick`\<\{ `id`: `string`; \}, `"id"`\>

#### firstComment

`Pick`\<\{ `content`: `string`; `discussion_id`: `string`; `id`: `string`; `parent_id`: `null` \| `string`; \}, `"content"`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`object` & `object`\>

the created discussion

## Example

```ts
  const changeSet = await createChangeSet({ lix, changes: ["change1", "change2"] });
  const discussion = await createDiscussion({ lix, changeSet, firstComment: { content: "first comment" } });
  ```

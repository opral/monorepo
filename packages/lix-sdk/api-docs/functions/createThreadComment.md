[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createThreadComment

# Function: createThreadComment()

> **createThreadComment**(`args`): `Promise`\<[`LixSelectable`](../type-aliases/LixSelectable.md)\<[`EntityStateView`](../type-aliases/EntityStateView.md)\<[`ThreadComment`](../type-aliases/ThreadComment.md)\>\>\>

Defined in: [packages/lix-sdk/src/thread/create-thread-comment.ts:18](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/thread/create-thread-comment.ts#L18)

Adds a comment to an existing thread.

The comment inherits the version context from the thread and can
be nested by supplying a parent id.

## Parameters

### args

`object` & `object` & `object`

## Returns

`Promise`\<[`LixSelectable`](../type-aliases/LixSelectable.md)\<[`EntityStateView`](../type-aliases/EntityStateView.md)\<[`ThreadComment`](../type-aliases/ThreadComment.md)\>\>\>

## Example

```ts
await createThreadComment({ lix, thread_id, body: "Thanks" })
```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createThread

# Function: createThread()

> **createThread**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/thread/create-thread.ts:19](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/thread/create-thread.ts#L19)

Starts a new discussion thread.

Threads allow collaborators to attach comments to a specific
version or entity. Initial comments can be provided and will be
inserted sequentially.

## Parameters

### args

#### comments?

`Pick`\<[`NewState`](../type-aliases/NewState.md)\<[`ThreadComment`](../type-aliases/ThreadComment.md)\>, `"body"`\>[]

#### id?

`string`

#### lix

[`Lix`](../type-aliases/Lix.md)

#### versionId?

`string`

defaults to global

## Returns

`Promise`\<`object` & `object`\>

## Example

```ts
const thread = await createThread({ lix, comments: [{ body: "Hello" }] })
```

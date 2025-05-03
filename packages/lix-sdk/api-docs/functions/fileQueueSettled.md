[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / fileQueueSettled

# Function: fileQueueSettled()

> **fileQueueSettled**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/file-queue/file-queue-settled.ts:11](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/file-queue/file-queue-settled.ts#L11)

Waits until the file queue is settled.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
  await fileQueueSettled({ lix });
  ```

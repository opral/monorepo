[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / fileQueueSettled

# Function: fileQueueSettled()

> **fileQueueSettled**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/file-queue/file-queue-settled.ts:11](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/file-queue/file-queue-settled.ts#L11)

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

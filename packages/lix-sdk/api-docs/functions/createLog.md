[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createLog

# Function: createLog()

> **createLog**(`args`): `Promise`\<\{ `created_at`: `string`; `key`: `string`; `level`: `string`; `message`: `string`; \}\>

Defined in: [packages/lix-sdk/src/log/create-log.ts:26](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/log/create-log.ts#L26)

Directly creates a log entry in the Lix database without applying any filters.

This function inserts the log entry regardless of the `lix_log_levels` setting
in the key-value store. It is the responsibility of the calling application
to implement any desired log level filtering before invoking this function.

It is recommended to use dot notation for log keys (e.g., 'app.module.component').

## Parameters

### args

#### key

`string`

#### level

`string`

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

#### message

`string`

## Returns

`Promise`\<\{ `created_at`: `string`; `key`: `string`; `level`: `string`; `message`: `string`; \}\>

A promise that resolves with the created log entry.

## Example

```ts
// Directly log an info message

if (shouldLog) {
  await createLog({
    lix,
    key: 'app.init',
    level: 'info',
    message: 'Application initialized'
});
```

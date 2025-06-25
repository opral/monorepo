[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createLabel

# Function: createLabel()

> **createLabel**(`args`): `Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/label/create-label.ts:17](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/label/create-label.ts#L17)

Creates a label that can be attached to change sets.

Labels help categorise change sets, for example "checkpoint" or
"reviewed". They are simple name identifiers stored per version.

## Parameters

### args

#### id?

[`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### lixcol_version_id?

`string`

#### name

`string`

## Returns

`Promise`\<\{ `id`: [`LixGenerated`](../type-aliases/LixGenerated.md)\<`string`\>; `name`: `string`; \}\>

## Example

```ts
const label = await createLabel({ lix, name: "checkpoint" })
```

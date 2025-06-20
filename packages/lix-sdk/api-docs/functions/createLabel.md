[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createLabel

# Function: createLabel()

> **createLabel**(`args`): `Promise`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/label/create-label.ts:5](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/label/create-label.ts#L5)

## Parameters

### args

#### id?

`string`

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### lixcol_version_id?

`string`

#### name

`string`

## Returns

`Promise`\<\{ `id`: `string`; `lixcol_created_at`: `string`; `lixcol_file_id`: `string`; `lixcol_inherited_from_version_id`: `null` \| `string`; `lixcol_updated_at`: `string`; `name`: `string`; \}\>

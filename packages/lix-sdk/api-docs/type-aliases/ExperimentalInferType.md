[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ExperimentalInferType

# Type Alias: ExperimentalInferType\<ChangeSchema\>

> **ExperimentalInferType**\<`ChangeSchema`\> = `ChangeSchema` *extends* `object` ? `FromSchema`\<`ChangeSchema`\[`"schema"`\]\> : `ChangeSchema` *extends* `object` ? `any` : `ChangeSchema` *extends* `object` ? `ArrayBuffer` : `never`

Defined in: [packages/lix-sdk/src/change-schema/types.ts:6](https://github.com/opral/monorepo/blob/b171e3e71d4461028abf991c33609fbcfb064d33/packages/lix-sdk/src/change-schema/types.ts#L6)

Infers the snapshot content type from the schema.

## Type Parameters

### ChangeSchema

`ChangeSchema`

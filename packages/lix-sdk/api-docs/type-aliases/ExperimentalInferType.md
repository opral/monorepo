[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ExperimentalInferType

# Type Alias: ExperimentalInferType\<ChangeSchema\>

> **ExperimentalInferType**\<`ChangeSchema`\> = `ChangeSchema` *extends* `object` ? `FromSchema`\<`ChangeSchema`\[`"schema"`\]\> : `ChangeSchema` *extends* `object` ? `any` : `ChangeSchema` *extends* `object` ? `ArrayBuffer` : `never`

Defined in: [packages/lix-sdk/src/change-schema/types.ts:6](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/change-schema/types.ts#L6)

Infers the snapshot content type from the schema.

## Type Parameters

### ChangeSchema

`ChangeSchema`

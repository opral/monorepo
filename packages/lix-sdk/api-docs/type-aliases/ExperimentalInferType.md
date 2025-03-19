[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / ExperimentalInferType

# Type Alias: ExperimentalInferType\<ChangeSchema\>

> **ExperimentalInferType**\<`ChangeSchema`\> = `ChangeSchema` *extends* `object` ? `FromSchema`\<`ChangeSchema`\[`"schema"`\]\> : `ChangeSchema` *extends* `object` ? `any` : `ChangeSchema` *extends* `object` ? `ArrayBuffer` : `never`

Defined in: [packages/lix-sdk/src/change-schema/types.ts:6](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/change-schema/types.ts#L6)

Infers the snapshot content type from the schema.

## Type Parameters

### ChangeSchema

`ChangeSchema`

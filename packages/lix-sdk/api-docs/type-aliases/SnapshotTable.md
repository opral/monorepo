[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / SnapshotTable

# Type Alias: SnapshotTable

> **SnapshotTable** = `object`

Defined in: [packages/lix-sdk/src/snapshot/database-schema.ts:45](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/snapshot/database-schema.ts#L45)

## Properties

### content

> **content**: `Record`\<`string`, `any`\> \| `null`

Defined in: [packages/lix-sdk/src/snapshot/database-schema.ts:56](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/snapshot/database-schema.ts#L56)

The value of the change.

Lix interprets an undefined value as delete operation.

#### Example

```ts
- For a csv cell change, the value would be the new cell value.
  - For an inlang message change, the value would be the new message.
```

***

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/snapshot/database-schema.ts:46](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/snapshot/database-schema.ts#L46)

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewStateAll

# Type Alias: NewStateAll\<T\>

> **NewStateAll**\<`T`\> = [`LixInsertable`](LixInsertable.md)\<[`EntityStateAllView`](EntityStateAllView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:298](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/entity-views/types.ts#L298)

Type for creating new entities with version control.

This type includes lixcol_version_id for creating entities in specific
versions. Like NewState, it makes LixGenerated columns optional.

## Type Parameters

### T

`T`

## Example

```typescript
// Use NewStateAll for version-specific creation
async function createFeatureFlag(versionId: string, flag: {
  key: string;
  value: boolean;
}) {
  const newFlag: NewStateAll<KeyValue> = {
    key: flag.key,
    value: flag.value,
    lixcol_version_id: versionId  // Create in specific version
  };

  await lix.db
    .insertInto("key_value_all")
    .values(newFlag)
    .execute();
}
```

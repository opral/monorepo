[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / StateAllUpdate

# Type Alias: StateAllUpdate\<T\>

> **StateAllUpdate**\<`T`\> = [`LixUpdateable`](LixUpdateable.md)\<[`EntityStateAllView`](EntityStateAllView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:328](https://github.com/opral/monorepo/blob/3025726c2bce8185b41ef0b1b2f7cc069ebcf2b0/packages/lix-sdk/src/entity-views/types.ts#L328)

Type for updating entities in specific versions.

This type makes all columns optional for partial updates and includes
version control. You can update entities in any version or change
an entity's version.

## Type Parameters

### T

`T`

## Example

```typescript
// Use StateAllUpdate for version-specific updates
async function toggleFeatureFlag(
  key: string,
  versionId: string,
  enabled: boolean
) {
  const updates: StateAllUpdate<KeyValue> = {
    value: enabled
  };

  await lix.db
    .updateTable("key_value_all")
    .set(updates)
    .where("key", "=", key)
    .where("lixcol_version_id", "=", versionId)
    .execute();
}
```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / StateUpdate

# Type Alias: StateUpdate\<T\>

> **StateUpdate**\<`T`\> = [`LixUpdateable`](LixUpdateable.md)\<[`EntityStateView`](EntityStateView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:270](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/entity-views/types.ts#L270)

Type for updating entities in the active version.

This type makes all columns optional, allowing partial updates.
Only include the fields you want to change - the database will
preserve existing values for omitted fields.

## Type Parameters

### T

`T`

## Example

```typescript
// Use StateUpdate for update form data
interface UpdateSettingData {
  updates: StateUpdate<KeyValue>;
}

async function updateSetting(key: string, updates: UpdateSettingData) {
  // Only update the fields that changed
  const patch: StateUpdate<KeyValue> = {
    value: updates.updates.value
    // key, timestamps, etc. remain unchanged
  };

  await lix.db
    .updateTable("key_value")
    .set(patch)
    .where("key", "=", key)
    .execute();
}
```

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewState

# Type Alias: NewState\<T\>

> **NewState**\<`T`\> = [`LixInsertable`](LixInsertable.md)\<[`EntityStateView`](EntityStateView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:239](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/entity-views/types.ts#L239)

Type for creating new entities in the active version.

This type makes all LixGenerated columns optional (like id, timestamps),
while keeping other required fields mandatory. The database will
automatically populate generated fields if not provided.

## Type Parameters

### T

`T`

## Example

```typescript
// Use NewState for form data types
interface SettingsFormData {
  setting: NewState<KeyValue>;
}

async function createSetting(formData: SettingsFormData) {
  // Only key and value are required
  const newSetting: NewState<KeyValue> = {
    key: formData.setting.key,
    value: formData.setting.value
    // lixcol_created_at, lixcol_file_id etc. are auto-generated
  };

  await lix.db
    .insertInto("key_value")
    .values(newSetting)
    .execute();
}
```

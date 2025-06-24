[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / EntityStateHistoryView

# Type Alias: EntityStateHistoryView\<T\>

> **EntityStateHistoryView**\<`T`\> = `T` & `StateEntityHistoryColumns`

Defined in: [packages/lix-sdk/src/entity-views/types.ts:109](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/entity-views/types.ts#L109)

View type for entity history (read-only).

This type combines your entity properties with historical tracking columns,
allowing you to see how entities evolved over time through different change sets.

History views are read-only and include change tracking information like
change_id, change_set_id, and depth for blame functionality.

## Type Parameters

### T

`T`

## Example

```typescript
// Define a history view type for key-value entities
type KeyValueHistoryView = EntityStateHistoryView<KeyValue>;

// Query entity state at a specific change set
await lix.db
  .selectFrom("key_value_history")
  .where("lixcol_change_set_id", "=", changeSetId)
  .where("lixcol_depth", "=", 0)
  .selectAll()
  .execute();
```

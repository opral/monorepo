[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / StateHistory

# Type Alias: StateHistory\<T\>

> **StateHistory**\<`T`\> = [`LixSelectable`](LixSelectable.md)\<[`EntityStateHistoryView`](EntityStateHistoryView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:208](https://github.com/opral/monorepo/blob/e71bdb871680205b7a92b34085dd7fe79344e0d0/packages/lix-sdk/src/entity-views/types.ts#L208)

Type for querying entity history.

This type unwraps all LixGenerated markers and includes historical tracking
columns like change_id, change_set_id, and depth. Use this for blame
functionality and understanding how entities evolved.

History queries are read-only.

## Type Parameters

### T

`T`

## Example

```typescript
// Use StateHistory for blame UI
interface BlameViewProps {
  history: StateHistory<KeyValue>[];
}

function BlameView({ history }: BlameViewProps) {
  return (
    <ul>
      {history.map(state => (
        <li key={state.lixcol_change_id}>
          <strong>Depth {state.lixcol_depth}:</strong> {state.value}
          <br />
          <small>Change: {state.lixcol_change_id}</small>
        </li>
      ))}
    </ul>
  );
}
```

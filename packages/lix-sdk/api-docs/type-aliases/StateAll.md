[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / StateAll

# Type Alias: StateAll\<T\>

> **StateAll**\<`T`\> = [`LixSelectable`](LixSelectable.md)\<[`EntityStateAllView`](EntityStateAllView.md)\<`T`\>\>

Defined in: [packages/lix-sdk/src/entity-views/types.ts:175](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/entity-views/types.ts#L175)

Type for querying entities across all versions.

This type unwraps all LixGenerated markers and includes the version_id column,
allowing you to work with entities from any version in the database.

All properties are required and have their actual types (no LixGenerated wrappers).

## Type Parameters

### T

`T`

## Example

```typescript
// Use StateAll for version comparison UI
interface VersionDiffProps {
  oldValue: StateAll<KeyValue>;
  newValue: StateAll<KeyValue>;
}

function VersionDiff({ oldValue, newValue }: VersionDiffProps) {
  return (
    <div>
      <h4>{oldValue.key}</h4>
      <div>Version {oldValue.lixcol_version_id}: {oldValue.value}</div>
      <div>Version {newValue.lixcol_version_id}: {newValue.value}</div>
    </div>
  );
}
```

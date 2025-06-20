[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValueView

# Type Alias: KeyValueView

> **KeyValueView** = `object` & `StateEntityView`

Defined in: [packages/lix-sdk/src/key-value/schema.ts:43](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/key-value/schema.ts#L43)

## Type declaration

### key

> **key**: `KeyValueKeys`

The key of the key-value pair.

Lix prefixes its keys with "lix_" to avoid conflicts with user-defined keys.
Provides autocomplete for predefined keys while allowing custom keys.

#### Example

```ts
"lix_id"
  "lix_sync"
  "namespace_cool_key"
```

### value

> **value**: `any`

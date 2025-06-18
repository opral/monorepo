[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValueView

# Type Alias: KeyValueView

> **KeyValueView** = `object` & `StateEntityView`

Defined in: [packages/lix-sdk/src/key-value/schema.ts:42](https://github.com/opral/monorepo/blob/0501d8fe7eed9db1f8058e8d1d58b1d613ceaf43/packages/lix-sdk/src/key-value/schema.ts#L42)

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

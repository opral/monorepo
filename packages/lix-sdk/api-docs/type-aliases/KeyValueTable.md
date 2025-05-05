[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValueTable

# Type Alias: KeyValueTable

> **KeyValueTable** = `object`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:30](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/key-value/database-schema.ts#L30)

## Properties

### key

> **key**: `KeyValueKeys`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:39](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/key-value/database-schema.ts#L39)

The key of the key-value pair.

Lix prefixes its keys with "lix-" to avoid conflicts with user-defined keys.

#### Example

```ts
"namespace-cool-key"
```

***

### skip\_change\_control

> **skip\_change\_control**: `Generated`\<`boolean`\>

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:59](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/key-value/database-schema.ts#L59)

If `true`, the key-value pair is not tracked with own change control.

Carefull (!) when querying the database. The return value will be `0` or `1`.
SQLite does not have a boolean select type https://www.sqlite.org/datatype3.html.

#### Default

```ts
false
```

***

### value

> **value**: `JSON`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:50](https://github.com/opral/monorepo/blob/0c842a72d3025295846c020e08a97bf5148757a1/packages/lix-sdk/src/key-value/database-schema.ts#L50)

The value of the key-value pair.

Must be a string. A JSON is a string too ;)

#### Example

```ts
"some value"
  "{ "foo": "bar" }"
```

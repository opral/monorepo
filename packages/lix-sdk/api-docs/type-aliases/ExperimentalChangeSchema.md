[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ExperimentalChangeSchema

# Type Alias: ExperimentalChangeSchema

> **ExperimentalChangeSchema** = \{ `key`: `string`; `schema`: `JSONSchema`; `type`: `"json"`; \} \| \{ `key`: `string`; `schema?`: `undefined`; `type`: `"blob"`; \}

Defined in: [packages/lix-sdk/src/change-schema/types.ts:43](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/change-schema/types.ts#L43)

The schema of a detected change.

The key is used to identify the schema. It is highly
recommended to use a unique key for each schema and
include a version number in the key when breaking
changes are made.

- use `as const` to narrow the types
- use `... satisfies ChangeSchema` to get autocomplete

## Example

```ts
const FooV1 = {
     key: "csv-plugin-foo-v1",
     type: "json",
     schema: jsonSchema,
  } as const satisfies ChangeSchema;
```

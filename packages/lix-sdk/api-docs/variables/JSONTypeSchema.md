[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / JSONTypeSchema

# Variable: JSONTypeSchema

> `const` **JSONTypeSchema**: `Record`\<`string`, `any`\>

Defined in: [packages/lix-sdk/src/schema-definition/json-type.ts:20](https://github.com/opral/monorepo/blob/b744c06f94e2e95227e07cc6016002a653e430d8/packages/lix-sdk/src/schema-definition/json-type.ts#L20)

JSON schema definition for JSON values (object, array, string, number, boolean, null).

## Example

```ts
const MySchema = {
    type: "object",
    properties: {
      myJsonField: JSONTypeSchema,
    },
  }
```

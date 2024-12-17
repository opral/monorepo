JSON types that are used across inlang's codebase (and hopefully useful to external developers as well!).

### Usage

#### As type

Importing any JSONObject as `type` will prune runtime validation code.

```ts
import type { JSONObject } from "@inlang/json-types";

type MyType = JSONObject<{
  foo: string;
  bar: number;
}>;
```

#### Validation

Every JSONObject is defined as [JSONSchema](https://json-schema.org/) with [typebox](https://github.com/sinclairzx81/typebox) and can be used for validation

```ts
import { JSONObject } from "@inlang/json-types";

const isValid = someJsonSchemaValidator(
  JSONObject({
    foo: string(),
    bar: number(),
  }),
);
```

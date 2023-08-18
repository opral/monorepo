JSON serializable utility type that is used across inlang's codebase (and hopefully useful to external developers as well!).

### Usage

#### As type

Importing any JSONSerializable as `type` will prune runtime validation code.

```ts
import type { JSONSerializableObject } from "@inlang/json-serializable"

type MyType = JSONSerializableObject<{
	foo: string
	bar: number
}>
```

#### Validation

Every JSONSerializable is defined as [JSONSchema](https://json-schema.org/) with [typebox](https://github.com/sinclairzx81/typebox) and can be used for validation

```ts
import { JSONSerializableObject } from "@inlang/json-serializable"

const isValid = someJsonSchemaValidator(
	JSONSerializableObject({
		foo: string(),
		bar: number(),
	}),
)
```

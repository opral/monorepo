# @inlang/ast/query

Function with CRUD (Create, Retrieve, Update, Delete) queries for the AST.

## Design goals and choices

### 1. Immutable operations

Immutability is good practice, eases CMD-Z (history) operations, plays nicely with `map`, and reactive systems that require explicit mutation (expressed by the assignation symbol `=` i.e. `x = y`) or setter functions to track reactivity.

## API

```js
// single resource queries
resource = query(resource) // resource
	.create() // message

resource = query(resource) // single resource
	.get("id") // message

resource = query(resource) // resource
	.update("id") // message

resource = query(resource) // resource
	.delete("id") // message

// multiple resource queries
const resources = [x, y, z]
resources = resources.map((resource) => query(resource).delete("id"))
```

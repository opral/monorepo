# @inlang/ast/query

Function with CRUD (Create, Retrieve, Update, Delete) queries for the AST.

## Design goals and choices

### 1. Immutable operations

Immutability is good practice, eases CMD-Z (history) operations, plays nicely with `map`, and is more or less required for Svelte. Svelte uses explicit mutation (expressed by the assignation symbol `=` i.e. `x = y`) to track reactivity.

## API

```js
// single bundle queries
bundle = query(bundle) // bundle
	.create(); // message

bundle = query([resource]) // single resource
	.get("id"); // message

bundle = query(bundle) // bundle
	.update("id"); // message

bundle = query(bundle) // bundle
	.delete("id"); // message

// multiple bundle queries
const bundles = [x, y, z];
bundles = bundles.map((bundle) => query(bundle).delete("id"));
```

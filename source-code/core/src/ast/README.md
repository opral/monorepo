# @inlang/core/ast

The AST that inlang apps operate on, including related modules.

### What is an AST?

Translations (Messages) are usually stored in a file (Resource). An [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) is a machine-processable representation of a file (Resource) and contained
syntax (Messages). A parser creates (parses) the representation to an AST. A serializer reconstructs (serializes) a file from an AST.

![AST visualization](./ast-visualization.png)

## Design goals and choices

### 1. Stay close(er) to the planned industry-standard MessageFormat 2.0

The Unicode Consortium is working on a [new industry standard](https://github.com/unicode-org/message-format-wg) for representing localizable messages (strings). Basing the AST on the newly specified and planned industry-standard MessageFormat 2.0 supports the consolidation goal.

At the beginning of development, the MessageFormat 2.0 spec was unfinished and contained no specifications beyond the Message syntax. Thus, the initial design of the inlang AST is based on [Fluent](https://projectfluent.org/) which precedes and influences the design of Message Format 2.0.

### 2. The AST does not define properties that concern parsing or serialization.

A variety of resource formats exist that differ in syntax. Defining properties that concern parsing and/or serialization of different resource formats is out of scope. Instead, each type in the schema has an optional AST field. The AST field can be used to store information on how the type is parsed and serialized.

### 3. The extensibility of the Schema is important and ensured by using types (objects) instead of classes.

To ease extensibility, the Schema types consist of pure objects as opposed to classes.

By de-coupling data from functionality, the Schema (objects) can be used as the API between functions that inlang, the community, or a developer itself might provide.

```ts
// If the AST consists of pure objects
import type { Resource } from "@inlang/schema"
const resource: Resource = {
	// ...
}

// the functionality of the ast can be extended with function

// from inlang
import { query } from "@inlang/schema/query"
// the community
import { format } from "community"
// or your own
function example(resource: Resource) {}

// inlang exports a query function
const message = query(resource).get("some-id")
// someone created an awesome format function
const formattedMessage = format(message)

// one is able to mix and match since the AST definition are pure objects.
```

Coupling data with functionality (classes) leads to overhead. A `format` function might not need the `query` functionalities and vice versa.

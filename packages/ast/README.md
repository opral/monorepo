# @inlang/ast

The AST that inlang apps operate on, including related modules.

### What is an AST?

Translations (Messages) are usually stored in a file (Resource). An [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) is a machine-processable representation of a file (Resource) and contained
syntax (Messages). A parser creates (parses) the representation to an AST. A serializer reconstructs (serializes) a file from an AST.

![AST visualization](./ast-visualization.png)

## Modules

Click on the modules to get to their respective READMEs.

- [@inlang/ast](./src/) - The AST.
- [@inlang/ast/query](./src/query/) - A query module for the AST.

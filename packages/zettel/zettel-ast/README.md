# Zettel AST

Zettel (German word for "a piece of paper on which anything can be written") is an AST for rich text.

The goal is to define an standard AST (abstract syntax tree) to represent content in comments, issues, documents, and more — enabling interoperability across different products.

Zettel is:

- **Portable** — stored as plain JSON

- **Composable** — works across apps and domains

- **Extensible** — can be extened with custom marks and blocks

- **Unopinionated** — no rendering or storage assumptions

## Goal

Have a standard rich text AST instead of falling back to markdown, which is unsuited for rich text (been there done that).

Watch this video https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312

## Non-goals

- define persistence of referenced assets

## Use case

Embedding rich text in UI components like comments, issue trackers, tasks, etc.

## Architecture

- builds on top of [Portable Text](https://portabletext.org/)
- parsers and serializers to convert between the Zettel AST and other formats

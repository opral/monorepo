# Zettel AST

Zettel (German word for "a piece of paper on which anything can be written") is an AST for rich text that enables interoperability across different products.

## Use case

Building rich text features in applications like mentions, links, bold, italic, etc. 

## Why Zettel?

https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312

### Problem

No standard rich text AST exists. 

Implementing rich text features in a product always requires a custom rich text AST, which leads every app to re-invent the wheel, and breaks interoperability.

- [Markdown is unsuited for rich text](https://www.smashingmagazine.com/2022/02/thoughts-on-markdown/)
- HTML can't be used outside the web and opens up a can of security issues (`dangerouslySetInnerHTML`)
- Editor specific ASTs like a Prosemirror Document are tied to an editor. 

### Solution

Zettel is a standard rich text AST that enables interoperability across different products without reinventing the wheel.

## Goals

- Provide common rich text AST nodes (like underline, bold, italic, etc.)
- Extendable with custom nodes 
- Portable and stored as plain JSON
- Unopinionated about rendering and storage

## Non-goals

- Define persistence of referenced assets

## Inspirations

- [Portable Text](https://portabletext.org/)

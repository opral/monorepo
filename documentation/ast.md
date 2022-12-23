---
title: Ast
href: /documentation/ast
description: The reference for the AST.
---

# {% $frontmatter.title %}

**Inlang operates on an AST (Abstract Syntax Tree). Using an AST gives inlang flexibility to adapt to different message syntaxes like ICU, formats such as JSON, ARB or JS, build linters for localization, and deliver an outstanding editing experience for translators.**

### Why does inlang use an AST instead of treating Messages as strings?

Expressing human languages is complex. So complex that code is required to express human languages. Code needs to be parsed, processed, and serialized to enable lintings, building a user interface, and more. Strings don't do justice to the complexity of human languages. Take a look at [this example sentence](https://cdn.jsdelivr.net/gh/inlang/inlang/documentation/assets/why-an-ast-is-required.webp) and the resulting complexity.

### Reference

{% Callout variant="info" %}
**The AST definition is small on purpose.** Feedback and requirements from users will define what nodes and properties are added. Participate in the [discussions](https://github.com/inlang/inlang/discussions).  
{% /Callout %}

_Up-to-date definitions of the AST can be found [here](https://github.com/inlang/inlang/blob/main/source-code/core/src/ast/index.ts)_

```ts
/**
 * A single node of the AST.
 *
 * Every other defintions are based on Node.
 */
export type Node<Name> = {
	type: Name;
	/**
	 * Metadata is ignored by inlang.
	 *
	 * Use the metadata property to store additional
	 * information for a particular node like parsing
	 * and serialization information.
	 */
	metadata?: unknown;
};

/**
 * An identifier.
 *
 * Some Nodes have Identifiers such as a Bundle or Message.
 */
export type Identifier = Node<"Identifier"> & {
	name: string;
};

/**
 * A bundle holds a group of resources.
 */
export type Bundle = Node<"Bundle"> & {
	id: Identifier;
	resources: Resource[];
};

/**
 * A resource is a collection of messages.
 */
export type Resource = Node<"Resource"> & {
	id: Identifier;
	body: Array<Message>;
};

/**
 * A message is what's rendered to a user.
 */
export type Message = Node<"Message"> & {
	id: Identifier;
	// comment?: MessageComment;
	pattern: Pattern;
};

/**
 * A pattern denotes how a Message is composed.
 */
export type Pattern = Node<"Pattern"> & {
	elements: Array<Text>;
};

/**
 * Text can be translated.
 */
export type Text = Node<"Text"> & {
	value: string;
};
```

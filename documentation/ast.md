---
title: Abstract Syntax Tree (AST) of inlang
shortTitle: AST
href: /documentation/ast
description: Learn about the inlang AST and how it is used to represent messages.
---

# {% $frontmatter.shortTitle %}

**Inlang operates on an AST (Abstract Syntax Tree). Using an AST gives inlang flexibility to adapt to different message syntaxes like ICU, formats such as JSON, ARB or JS, build linters for localization, and deliver an outstanding editing experience for translators.**

Expressing human languages is complex. So complex that code is required to express human languages. Code needs to be parsed, processed, and serialized to enable lintings, building a user interface, and more. Strings don't do justice to the complexity of human languages. Take a look at [this example sentence](https://cdn.jsdelivr.net/gh/inlang/inlang/documentation/assets/why-an-ast-is-required.webp) and the resulting complexity.

## Reference

Up-to-date reference can be found [in the repository](https://github.com/inlang/inlang/blob/main/source-code/core/src/ast/schema.ts).

{% Callout variant="info" %}
**The AST definition is small on purpose.** Feedback and requirements from users will define what nodes and properties are added. Participate in the [discussions](https://github.com/inlang/inlang/discussions).  
{% /Callout %}

{% Figure
  src="https://user-images.githubusercontent.com/72493222/214296359-1ddd2fdb-03f3-4993-a493-9b1a353c4b88.png"
  alt="visualisation of the inlang AST/object"
  caption="Visualisation of the inlang AST/object"
/%}

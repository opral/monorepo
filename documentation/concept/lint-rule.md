---
title: Lint rule
href: /documentation/lint-rule
description: Lint rules validate messages and other types of content in an inlang project.
---

# {% $frontmatter.title %}

{% $frontmatter.description %}

For example, the [missing translation lint rule](TODO-link-to-marketplace) reports an issue if a message is missing a translation for a specified [language tag](/documentation/concepts/language-tag). Inlang applications use lint rules to validate content and report issues to the user.

![inlang empty-pattern lint rule](https://cdn.jsdelivr.net/gh/inlang/inlang/documentation/assets/lintrule.jpg)

## Types of lint rules

### Message lint rule

A message lint rule validates a message. For example, the [missing translation lint rule](TODO-link-to-marketplace) validates that a message has a translation for a specified [language tag](/documentation/concepts/language-tag).

### More soon...

We will support more types of lint rules in the future. If you have an idea for a new lint type, please share it with us on [GitHub](https://github.com/inlang/inlang/discussions).

## Develop your own lint rule

Learn how to build custom lint rules in the [develop an inlang lint rule](/documentation/guides/develop-lint-rule) guide.

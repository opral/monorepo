---
imports: 
    - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-header.js
    - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js
    - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js
---


<doc-header title="What is a Lint Rule?" description="Validate content in an inlang project." button="Get started" link="/documentation/lint-rule/guide">
</doc-header>

<br/>

<!-- ![pluginCover](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/plugin/assets/plugin-cover.png) -->

Lint rules validate messages and other types of content in an inlang project.

For example, the [missing translation lint rule](/m/4cxm3eqi/messageLintRule-inlang-missingTranslation) reports an issue if a message is missing a translation for a specified [language tag](/documentation/concept/language-tag). Inlang applications use lint rules to validate content and report issues to the user.

## Types of lint rules

![inlang message lints](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/lintrule-messagelints.jpg)

### Message lint rule

A message lint rule validates a message. For example, the [missing translation lint rule](/m/4cxm3eqi/messageLintRule-inlang-missingTranslation) validates that a message has a translation for a specified [language tag](/documentation/concept/language-tag).

![inlang code lints](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/lintrule-codelints.jpg)

### More soon...

We will support more types of lint rules in the future. If you have an idea for a new lint type, please share it with us on [GitHub](https://github.com/opral/monorepo/discussions).

<doc-links>
    <doc-link title="API Introduction" icon="mdi:book-open-page-variant" href="/documentation/lint-rule/api-introduction" description="Read Lint Rule API Reference."></doc-link>
    <doc-link title="Build a Lint Rule" icon="mdi:skip-next" href="/documentation/lint-rule/guide" description="Learn how to build your first Lint Rule."></doc-link>
</doc-links>

<br/>
<br/>

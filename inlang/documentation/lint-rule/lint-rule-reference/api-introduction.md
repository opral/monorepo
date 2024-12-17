# Lint Rule API Introduction

The Lint Rule API provides a straightforward way to implement linting rules for messages in your `project`. The API can be categorized into two main blocks: `meta` and `lint logic`.

The core of the lint rule is encapsulated in the `lint logic`, a function named `message`. This function receives a message along with additional contextual information, such as `languageTags`, `sourceLanguageTag`, and a `report` callback. The `message` function is where you define and execute your custom linting logic, analyzing message variants and reporting issues as needed.

```ts
import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";

export const yourLintRule: MessageLintRule = {
  id,
  displayName,
  description,
  message: ({
    message: { id, variants },
    languageTags,
    sourceLanguageTag,
    report,
  }) => {
    // Your custom lint rule logic goes here
    // You can analyze message variants and report issues if necessary
  },
};
```

### Read more about these concepts:

<br/>

- [Messages](/documentation/concept/message)
- [Language Tags](/documentation/concept/language-tag)
- [Project](/documentation/concept/project)
- [Development Kit](/documentation)

<br/>
<br/>

<doc-links>
    <doc-link title="Lint Rule Guide" icon="mdi:book-open-page-variant" href="/documentation/lint-rule/guide" description="Learn how to build your Lint Rule."></doc-link>
    <doc-link title="API" icon="mdi:skip-next" href="/documentation/lint-rule/api" description="Read Lint Rule API Reference."></doc-link>
</doc-links>

<br/>
<br/>

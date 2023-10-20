# What does this rule do?

Checks messages to have a snake case message id.

# How to use

Add the lint rule to your modules array in your `project.inlang.json` file:

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "en",
  "languageTags": [
    "en",
    "de"
  ],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-with-snake-case-id@latest/dist/index.js"
  ],
}
```

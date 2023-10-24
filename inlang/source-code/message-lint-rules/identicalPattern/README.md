# What does this rule do?

Checks for identical patterns in different languages.  A message with identical wording in multiple languages can indicate that the translations are redundant or can be combined into a single message to reduce translation effort.

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
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js"
  ],
}
```

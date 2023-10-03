# What does this rule do?

Checks for empty pattern in a language tag. If a message exists in the reference resource but the pattern in a target resource is empty, it is likely that the message has not been translated yet.

# How to use

Add the lint rule to your modules array in your `project.inlang.json` file:

```json
{
  "sourceLanguageTag": "en",
  "languageTags": [
    "en",
    "de"
  ],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js"
  ],
  "settings": {
    /* ... */
  }
  }
}
```

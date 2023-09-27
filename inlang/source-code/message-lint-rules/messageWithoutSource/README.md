# What does this rule do?

Checks for likely outdated messages.  A message with a missing source is usually an indication that the message (id) is no longer used in source code, but messages have not been updated accordingly.

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
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js"
  ],
  "settings": {
    /* ... */
  }
  }
}
```

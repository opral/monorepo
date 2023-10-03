# What does this rule do?

Checks for missing variants for a specific languageTag.  If a variant exists for the sourceLanguageTag but is missing for a listed languageTag, it is likely that the message has not been translated for this languageTag yet.

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
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js"
  ],
  "settings": {
    /* ... */
  }
  }
}
```

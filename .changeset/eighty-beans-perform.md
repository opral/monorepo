---
"@inlang/plugin-message-format": major
---

Support for nesting of message keys

```json
//messages/en.json
{
  "hello_world": "Hello World!",
  "greeting": "Good morning {name}!",
  "nested": {
    "key": "Nested key"
  }
}
```

**BREAKING**

Complex messages that have variants need to be wrapped in an array to be distinguished from nested keys.

```diff
//messages/en.json
{
  "hello_world": "Hello World!",
+  "complex_message": [
    {
      "declarations": ["input count", "local countPlural = count: plural"],
      "selectors": ["countPlural"],
      "match": {
        "countPlural=one": "There is one item",
        "countPlural=other": "There are {count} items"
      }
    }
+  ]
}
```

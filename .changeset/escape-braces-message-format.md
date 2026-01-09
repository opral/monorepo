---
"@inlang/plugin-message-format": minor
---

Add support for escaping literal `{}` and backslashes in message patterns. Use `\{` and `\}` for literal braces, and `\\` for a literal backslash.

Example:

```json
{
  "json_object": "\\{\"a\": \"b\", \"c\": \"d\"\\}"
}
```

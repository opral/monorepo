---
"@inlang/plugin-message-format": major
---

re-enable strict property key enforcement to increase compatbility

```
{
  // BEFORE
  // hyphens where allowed by accident
  "my-cool-message": "Hello, {name}!",

  // AFTER
  // hyphens are not allowed
  "my_cool_message": "Hello, {name}!"
  "myCoolMessage": "Hello, {name}!",
}
```
---
"@inlang/paraglide-js": minor
---

Add optional chaining to compiled message inputs so missing inputs no longer throw at runtime; include tests covering single- and multi-variant messages.

Closes https://github.com/opral/inlang-paraglide-js/issues/568

Example:

```js
// compiled translation
export const greeting = (i) => `Hello ${i?.name}`;

// TypeScript still enforces the input shape; this is purely runtime safety (handy in dev).
greeting(); // no throw, returns "Hello undefined"
greeting({ name: "Ada" }); // "Hello Ada"

// previously (boom 💥)
export const greetingOld = (i) => `Hello ${i.name}`;
greetingOld(); // TypeError: Cannot read properties of undefined (reading 'name')
```

---
"@inlang/paraglide-js": minor
---

Implement custom strategy concept for locale resolution.

This introduces a new way to define custom locale resolution strategies alongside built-in strategies. Custom strategies provide a cleaner, more composable approach compared to overwriting `getLocale()` and `setLocale()` functions directly.

**New APIs:**

- `defineCustomClientStrategy()`: Define custom strategies for client-side locale resolution
- `defineCustomServerStrategy()`: Define custom strategies for server-side locale resolution

**Key features:**

- Custom strategies must follow the pattern `custom-<name>` where `<name>` contains only alphanumeric characters
- Can be combined with built-in strategies in the strategy array
- Respect strategy order for fallback handling
- Support both client and server environments
- Provide better error isolation and type safety

**Usage example:**

```js
import { defineCustomClientStrategy } from "./paraglide/runtime.js";

defineCustomClientStrategy("custom-sessionStorage", {
  getLocale: () => sessionStorage.getItem("user-locale") ?? undefined,
  setLocale: (locale) => sessionStorage.setItem("user-locale", locale),
});
```

Then include in your strategy configuration:

```js
compile({
  strategy: ["custom-sessionStorage", "cookie", "baseLocale"],
});
```

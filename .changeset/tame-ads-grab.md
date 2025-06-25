---
"@inlang/paraglide-js": minor
---

Add support for async custom server strategies with `extractLocaleFromRequestAsync`

This change introduces a new `extractLocaleFromRequestAsync` function that supports asynchronous custom server strategies, enabling use cases like fetching user locale preferences from databases.

## What's Changed

- **New Function**: Added `extractLocaleFromRequestAsync` that supports async custom server strategies
- **Middleware Update**: Server middleware now uses the async version to support async custom strategies
- **Breaking Change**: The synchronous `extractLocaleFromRequest` no longer supports custom server strategies
- **Improved Documentation**: Added comprehensive examples and usage guidance

## Migration Guide

### For users with custom server strategies:

**Before:**
```js
// This no longer works in sync version
defineCustomServerStrategy("custom-database", {
  getLocale: async (request) => {
    return await getUserLocaleFromDatabase(request);
  }
});

const locale = extractLocaleFromRequest(request); // Won't call async custom strategies
```

**After:**
```js
// Use the async version for custom strategies
defineCustomServerStrategy("custom-database", {
  getLocale: async (request) => {
    return await getUserLocaleFromDatabase(request);
  }
});

const locale = await extractLocaleFromRequestAsync(request); // Supports async custom strategies
```

### For users calling `extractLocaleFromRequest` directly:

If you're using `extractLocaleFromRequest` directly in your code without custom strategies, no changes are needed. For custom server strategies, switch to `extractLocaleFromRequestAsync`.

The server middleware automatically uses the async version, so no changes are needed for standard middleware usage.

Closes https://github.com/opral/inlang-paraglide-js/issues/527

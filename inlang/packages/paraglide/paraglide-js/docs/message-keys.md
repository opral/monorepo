---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Message Keys and Structure

## Nested keys are supported but not recommended

Paraglide JS supports nested keys through bracket notation syntax `m["something.nested"]()`, which simulates nesting without actually creating nested JavaScript objects. This approach leverages TypeScript's template literal types to provide type safety while maintaining the flat structure that enables tree-shaking.

<doc-callout type="warning">
  While nested keys are supported, we still recommend using flat keys. Flat keys align better with how databases, applications, and compilers naturally work — even though the bracket notation keeps the generated modules tree-shakeable.
</doc-callout>

## Why we recommend flat keys

### 1. Flat lists are the native format

- **Databases operate on flat structures**: Messages are stored in SQLite internally, which naturally uses flat key-value pairs
- **Applications use flat lookups**: At runtime, messages are accessed by key, not by traversing nested objects
- **Compilers work with flat lists**: The compilation process transforms each message into an individual function

### 2. Nested keys create unnecessary complexity

While nested keys might seem nice for developers initially, they create pain for everyone else in the ecosystem:

- **Translators**: Have to understand hierarchical structures instead of simple key-value pairs
- **Build tools**: Need to parse and transform nested structures into flat lists
- **Developer experience**: Flat keys compile to direct function names, which provide richer IDE support such as go-to-definition and auto-imports
- **Consistency across tooling**: Flat keys mirror how translators, design tools, and message catalogs typically represent content

## How to use nested keys (if you must)

If you have existing messages with dot notation, you can access them using bracket notation:

```json
// messages/en.json
{
  "nav.home": "Home",
  "nav.about": "About",
  "nav.contact": "Contact"
}
```

```ts
import { m } from "./paraglide/messages.js";

// Access with bracket notation
console.log(m["nav.home"]()); // "Home"
console.log(m["nav.about"]()); // "About"

// TypeScript provides autocomplete for these keys
type NavKey = "nav.home" | "nav.about" | "nav.contact";
const key: NavKey = "nav.home";
console.log(m[key]());
```

<doc-callout type="info">
  The bracket notation uses TypeScript's template literal types feature to maintain type safety while keeping the underlying structure flat. This is purely a TypeScript compile-time feature - at runtime, these are still individual functions.
</doc-callout>

## Recommended approach: Flat keys

Instead of nesting, use prefixes to organize related messages:

```json
// messages/en.json
{
  "nav_home": "Home",
  "nav_about": "About", 
  "nav_contact": "Contact",
  "footer_privacy": "Privacy Policy",
  "footer_terms": "Terms of Service"
}
```

Benefits of this approach:

```ts
import { m } from "./paraglide/messages.js";

// ✅ Direct function calls with perfect tree-shaking
console.log(m.nav_home()); // "Home"

// ✅ Better IDE support with go-to-definition
// ✅ Cleaner imports with auto-import
// ✅ No runtime overhead
```

## Working with dynamic keys

For dynamic menu systems, create explicit mappings:

```ts
import { m } from "./paraglide/messages.js";

// With flat keys (recommended)
const navMessages = {
  home: m.nav_home,
  about: m.nav_about,
  contact: m.nav_contact,
} as const;

// With nested keys (if needed)
const menuItems = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
] as const;

menuItems.forEach(item => {
  const label = m[item.key]();
  console.log(`<a href="${item.href}">${label}</a>`);
});
```

## Migration guide

If you're migrating from a library that uses nested keys:

### Option 1: Keep dots in keys (minimal changes)

```diff
// messages/en.json
{
-  "nav": {
-    "home": "Home",
-    "about": "About"
-  }
+  "nav.home": "Home",
+  "nav.about": "About"
}
```

```ts
// Access with bracket notation
const label = m["nav.home"]();
```

### Option 2: Flatten to underscores (recommended)

```diff
// messages/en.json
{
-  "nav": {
-    "home": "Home",
-    "about": "About"
-  }
+  "nav_home": "Home",
+  "nav_about": "About"
}
```

```ts
// Access as direct functions
const label = m.nav_home();
```
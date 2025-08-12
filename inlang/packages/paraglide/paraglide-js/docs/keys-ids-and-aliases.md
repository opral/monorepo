---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Messages, IDs, aliases, and nesting

Paraglide JS compiles your messages into tree‑shakable functions. Each message becomes a named export on `m`, e.g. `m.greeting()`.

There is no runtime JSON object or namespace like `m.nav.something`. Message IDs are flat and transformed into valid JS identifiers. For example, an ID `nav.something` becomes the function `m.nav_something()`.

## Flat messages, no namespaces

- **No nested objects**: Paraglide does not emit nested structures. Dots in IDs are treated as plain characters and are replaced with underscores in the generated API.
- **Bracket access exists but is not magic**: You can technically call `m["nav.something"]()` because JavaScript allows bracket access on properties. However, using arbitrary strings defeats tree‑shaking if used dynamically.
- **Recommendation**: Prefer flat IDs like `nav_something`, `nav_other`, … and call them with `m.nav_something()`.

```json
// messages/en.json
{
  "nav_something": "Something",
  "nav_other": "Other"
}
```

```ts
import { m } from "./paraglide/messages.js";

m.nav_something();
```

<doc-callout type="warning">
  Nested keys (e.g. `{ "nav": { "something": "…" } }`) are not supported as nested runtime objects. The `m.nav.something()` form does not exist.
</doc-callout>

## Why not nested keys?

- **Tree‑shaking**: Bundlers can only remove unused code when property accesses are statically analyzable. Nesting encourages dynamic string lookups like `m[section + "." + key]`, which prevents tree‑shaking.
- **Simplicity**: Paraglide compiles from a flat list of messages. Databases, tooling, and the compiler operate on flat IDs.

If you prefer visual grouping, use a naming convention like `nav_*`, `blog_*`, `auth_*`. Tooling (search, editor extensions, and web UIs) provides context without nested structures.

## Dynamic lookups (the safe, typed way)

To dynamically select messages while preserving tree‑shaking and TypeScript safety, pre‑declare what you will use:

```ts
import { m } from "./paraglide/messages.js";

const nav = {
  something: m.nav_something,
  other: m.nav_other,
} as const;

type NavKey = keyof typeof nav; // "something" | "other"

const menu: Array<{ label: NavKey; href: string }> = [
  { label: "something", href: "/something" },
  { label: "other", href: "/other" },
];

for (const item of menu) {
  console.log(nav[item.label]());
}
```

This preserves tree‑shaking because the concrete functions are referenced in `nav`, and still lets you choose one at runtime.

<doc-callout type="tip">
  If you use IDs with dots in files (e.g. `"nav.something"`), the generated function will be `m.nav_something()`. You can still access it via `m["nav.something"]()`, but prefer the `m.nav_something()` form for better tooling and tree‑shaking.
</doc-callout>

## Auto‑generated, human‑readable IDs (roadmap)

💡 This is an upcoming feature, see issue #1892.

Paraglide/Inlang will support human‑readable, auto‑generated IDs for messages. You will not need to hand‑craft keys like `login_button_label`.

Benefits:

- **Preserves change history** through immutable IDs
- **No naming discussions** about key conventions
- **Better tooling** for translators and designers in apps like Fink or Parrot

Example of a generated ID:

```txt
+id: "penguin_purple_shoe_window"
```

### Aliases

❗ Only use aliases if you import pre‑existing messages, not for newly created messages.

Aliases let you keep legacy keys while benefitting from the Inlang ecosystem. The auto‑generated ID remains the source of truth.

```yaml
id: "banana_car_sky_door"
+alias:
+  default: "login-page-card-title"
+  android: "signup-screen-card-title"
+  ios: "LOGIN_CARD_HEADER"
```

- **Use aliases when**: migrating existing projects or targeting multiple platforms that require different reference syntaxes.
- **Do not use aliases when**: creating new messages. Prefer the auto‑generated, human‑readable ID only.

### Why not use descriptive keys as IDs?

- **Change history loss**: Renaming a mutable key loses the message’s historical link. Systems resort to fuzzy matching which is error‑prone.
- **Naming overhead**: Teams waste time on conventions (kebab vs snake vs camel) that do not matter for referencing a message.

Use immutable, human‑readable IDs and let tooling provide the context of where a message is used.

## FAQ

- **I see `export const nav_something = …` in generated files. Why does `m.nav_something()` not exist for me?**
  Ensure your message ID is `nav_something` (flat). If your ID is `nav.something`, the generated API is `m.nav_something()` (underscore). There is no `m.nav.something()` namespace.

- **Can I keep dot IDs in files?**
  You can, but prefer underscores to match the generated API. If you keep dots, use `m["nav.something"]()` or rename to `nav_something` and call `m.nav_something()`.

- **Can TypeScript infer nested keys from JSON like `m.nav.something`?**
  No. Paraglide emits functions, not a nested object. Use the explicit mapping pattern above to get a union type for dynamic selection.

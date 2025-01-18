---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Compiler options

## `emitGitIgnore`

If `emitGitIgnore` is set to `true` a `.gitignore` file will be emitted in the output directory. Defaults to `true`. 

```diff
 - outdir/
  - messages/
+  - .gitignore
  - messages.js
  - runtime.js 
```

## `emitPrettierIgnore`

If `emitPrettierIgnore` is set to `true` a `.prettierignore` file will be emitted in the output directory. Defaults to `true`. 

```diff
 - outdir/
  - messages/
+  - .prettierignore
  - messages.js
  - runtime.js 
```

## `outputStructure` 

The `outputStructure` defines how modules are structured in the output. 

- `message-modules` - Each module is a message. This is the default.
- `locale-modules` - Each module is a language. 

### `message-modules`

Messages have their own module which eases tree-shaking for bundlers. 

```diff
 - outdir/
  - messages/
+   - blue_elephant_tree/
+     - index.js
+     - en.js
+     - fr.js
+   - sky_phone_bottle/
+     - index.js
+     - en.js
+     - fr.js
   - ...
  - messages.js
  - runtime.js 
```

### `locale-modules`

Messages are bundled in a per locale module. Bundlers sometimes struggle tree-shaking this structure. 

```diff
 - outdir/
  - messages/
+   - de.js
+   - en.js
+   - fr.js
   - ...
  - messages.js
  - runtime.js 
```

## `experimentalEmitTs`

Emits TypeScript files instead of JSDoc annotated JavaScript files. Defaults to `false`. 

<doc-callout type="warning">
This feature is experimental and may change or be removed in the future.
</doc-callout>

```diff
 - outdir/
-    - messages.js
+    - messages.ts
-    - runtime.js
+    - runtime.ts
     ...
```

## `experimentalUseTsImports`

Imports emitted files with `.ts` extension instead of `.js`. Defaults to `false`.

Only works in combination with `experimentalEmitTs`. The feature is useful in some 
codebases which need to resolve TypeScript files with a `.ts` ending. Node's 
strip-types flag is an example. 

<doc-callout type="warning">
This feature is experimental and may change or be removed in the future.
</doc-callout>

```diff
-import { getLocale } from "./runtime.js";
+import { getLocale } from "./runtime.ts";
```
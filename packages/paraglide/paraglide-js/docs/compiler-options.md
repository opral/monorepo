---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Compiler options

## `project`

The `project` option is the path to the inlang project. 

```json
"./project.inlang"
```

## `outdir`

The `outdir` option is the path to the output directory. 

```json
"./src/paraglide"
```

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

## `additionalFiles` 

The `additionalFiles` option is an array of paths to additional files that should be copied to the output directory. 

The option is often used by adapters to include additional files that are specific for a framework. 

```diff
await compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
  additionalFiles: [
+    "my-file.js": "console.log('hello')"
  ]
})
```

```diff
 - outdir/
  - messages/
+ - my-file.js
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

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
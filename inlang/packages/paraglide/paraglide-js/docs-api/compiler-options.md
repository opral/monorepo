## CompilerOptions

> **CompilerOptions**: `object`

Defined in: compiler-options.ts:12

### Type declaration

#### additionalFiles?

> `optional` **additionalFiles**: `Record`\<`string`, `string`\>

The `additionalFiles` option is an array of paths to additional files that should be copied to the output directory.

##### Example

```diff
await compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
  additionalFiles: [
+    "my-file.js": "console.log('hello')"
  ]
})
```

The output will look like this:

```diff
  - outdir/
    - messages/
+   - my-file.js
    - messages.js
    - runtime.js
```

#### cookieName?

> `optional` **cookieName**: `string`

The name of the cookie to use for the cookie strategy.

##### Default

```ts
'PARAGLIDE_LOCALE'
```

#### emitGitIgnore?

> `optional` **emitGitIgnore**: `boolean`

If `emitGitIgnore` is set to `true` a `.gitignore` file will be emitted in the output directory. Defaults to `true`.

```diff
  - outdir/
    - messages/
+   - .gitignore
    - messages.js
    - runtime.js
```

##### Default

```ts
true
```

#### emitPrettierIgnore?

> `optional` **emitPrettierIgnore**: `boolean`

If `emitPrettierIgnore` is set to `true` a `.prettierignore` file will be emitted in the output directory. Defaults to `true`.

```diff
  - outdir/
    - messages/
+   - .prettierignore
    - messages.js
    - runtime.js
```

##### Default

```ts
true
```

#### fs?

> `optional` **fs**: `any`

The file system to use. Defaults to `await import('node:fs')`.

Useful for testing the paraglide compiler by mocking the fs.

#### includeEslintDisableComment?

> `optional` **includeEslintDisableComment**: `boolean`

Whether to include an eslint-disable comment at the top of each .js file.

##### Default

```ts
true
```

#### outdir

> **outdir**: `string`

The path to the output directory.

##### Example

```diff
await compile({
  project: "./project.inlang",
+ outdir: "./src/paraglide"
})
```

#### outputStructure?

> `optional` **outputStructure**: `"locale-modules"` \| `"message-modules"`

The `outputStructure` defines how modules are structured in the output.

- `message-modules` - Each module is a message. This is the default.
- `locale-modules` - Each module is a locale.

**`message-modules`**

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

**`locale-modules`**

Messages are bundled in a per locale module. Bundlers sometimes struggle tree-shaking this structure.

```diff
  - outdir/
    - messages/
+     - de.js
+     - en.js
+     - fr.js
      - ...
  - messages.js
  - runtime.js
```

##### Default

```ts
"message-modules"
```

#### project

> **project**: `string`

The path to the inlang project.

##### Example

```diff
await compile({
+ project: "./project.inlang",
  outdir: "./src/paraglide"
})
```

#### strategy?

> `optional` **strategy**: [`Runtime`](runtime/type.md#runtime)\[`"strategy"`\]

The strategy to use for getting the locale.

The order of the strategy defines the precedence of matches.

For example, in `['pathname', 'cookie', 'baseLocale']`, the locale will be
first tried to be detected in the pathname, then in a cookie, and finally
fallback to the base locale.

The default ensures that the browser takes a cookie approach,
server-side takes the variable (because cookie is unavailable),
whereas both fallback to the base locale if not available.

##### Default

```ts
["cookie", "variable", "baseLocale"]
```

#### urlPatterns?

> `optional` **urlPatterns**: [`Runtime`](runtime/type.md#runtime)\[`"urlPatterns"`\]

TODO documentation

***

## defaultCompilerOptions

> `const` **defaultCompilerOptions**: `object`

Defined in: compiler-options.ts:3

### Type declaration

#### cookieName

> `readonly` **cookieName**: `"PARAGLIDE_LOCALE"` = `"PARAGLIDE_LOCALE"`

#### emitGitIgnore

> `readonly` **emitGitIgnore**: `true` = `true`

#### emitPrettierIgnore

> `readonly` **emitPrettierIgnore**: `true` = `true`

#### includeEslintDisableComment

> `readonly` **includeEslintDisableComment**: `true` = `true`

#### outputStructure

> `readonly` **outputStructure**: `"message-modules"` = `"message-modules"`

#### strategy

> `readonly` **strategy**: \[`"cookie"`, `"globalVariable"`, `"baseLocale"`\]

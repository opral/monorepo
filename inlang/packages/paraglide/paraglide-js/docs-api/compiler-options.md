## CompilerOptions

> **CompilerOptions**: `object`

Defined in: [compiler-options.ts:19](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/compiler-options.ts)

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

#### cleanOutdir?

> `optional` **cleanOutdir**: `boolean`

Whether to clean the output directory before writing the new files.

##### Default

```ts
true
```

#### cookieDomain?

> `optional` **cookieDomain**: `string`

The host to which the cookie will be sent.
If undefined, this defaults to the host portion of the current document location and the cookie is not available on subdomains.
Otherwise, subdomains are always included.

##### Default

```ts
window.location.hostname
```

#### cookieMaxAge?

> `optional` **cookieMaxAge**: `number`

The max-age in seconds of the cookie until it expires.

##### Default

```ts
60 * 60 * 24 * 400
```

#### cookieName?

> `optional` **cookieName**: `string`

The name of the cookie to use for the cookie strategy.

##### Default

```ts
'PARAGLIDE_LOCALE'
```

#### disableAsyncLocalStorage?

> `optional` **disableAsyncLocalStorage**: `boolean`

Replaces AsyncLocalStorage with a synchronous implementation.

⚠️ WARNING: This should ONLY be used in serverless environments
like Cloudflare Workers.

Disabling AsyncLocalStorage in traditional server environments
risks cross-request pollution where state from one request could
leak into another concurrent request.

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

#### experimentalMiddlewareLocaleSplitting?

> `optional` **experimentalMiddlewareLocaleSplitting**: `boolean`

Whether or not to use experimental middleware locale splitting.

⚠️ This feature is experimental and only works in SSR/SSG environment
  without client-side routing. Do not rely on this feature for production.

This feature is part of the exploration of per locale splitting. The
issue is ongoing and can be followed here [#88](https://github.com/opral/inlang-paraglide-js/issues/88).

- The client bundle will tree-shake all messages (have close to 0kb JS).
- The server middleware will inject the used messages into the HTML.
- The client will re-trieve the messages from the injected HTML.

##### Default

```ts
false
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

#### isServer?

> `optional` **isServer**: `string`

Tree-shaking flag if the code is running on the server.

Dependent on the bundler, this flag must be adapted to
enable tree-shaking.

##### Example

```ts
// vite
  isServer: "import.meta.env.SSR"
```

##### Default

```ts
typeof window === "undefined"
```

#### localStorageKey?

> `optional` **localStorageKey**: `string`

The name of the localStorage key to use for the localStorage strategy.

##### Default

```ts
'PARAGLIDE_LOCALE'
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

It is recommended to use `locale-modules` for development and `message-modules` for production.
Bundlers speed up the dev mode by bypassing bundling which can lead to many http requests
during the dev mode with `message-modules`. See https://github.com/opral/inlang-paraglide-js/issues/486.

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

Messages are bundled in a per locale module. Bundlers often struggle with tree-shaking this structure,
which can lead to more inefficient tree-shaking and larger bundle sizes compared to `message-modules`.

The benefit are substantially fewer files which is needed in large projects.

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

For example, in `['url', 'cookie', 'baseLocale']`, the locale will be
first tried to be detected in the url, then in a cookie, and finally
fallback to the base locale.

The default ensures that the browser takes a cookie approach,
server-side takes the globalVariable (because cookie is unavailable),
whereas both fallback to the base locale if not available.

##### Default

```ts
["cookie", "globalVariable", "baseLocale"]
```

#### urlPatterns?

> `optional` **urlPatterns**: [`Runtime`](runtime/type.md#runtime)\[`"urlPatterns"`\]

https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url

***

## defaultCompilerOptions

> `const` **defaultCompilerOptions**: `object`

Defined in: [compiler-options.ts:3](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/compiler-options.ts)

### Type declaration

#### cleanOutdir

> `readonly` **cleanOutdir**: `true` = `true`

#### cookieDomain

> `readonly` **cookieDomain**: `""` = `""`

#### cookieMaxAge

> `readonly` **cookieMaxAge**: `number`

#### cookieName

> `readonly` **cookieName**: `"PARAGLIDE_LOCALE"` = `"PARAGLIDE_LOCALE"`

#### disableAsyncLocalStorage

> `readonly` **disableAsyncLocalStorage**: `false` = `false`

#### emitGitIgnore

> `readonly` **emitGitIgnore**: `true` = `true`

#### emitPrettierIgnore

> `readonly` **emitPrettierIgnore**: `true` = `true`

#### experimentalMiddlewareLocaleSplitting

> `readonly` **experimentalMiddlewareLocaleSplitting**: `false` = `false`

#### includeEslintDisableComment

> `readonly` **includeEslintDisableComment**: `true` = `true`

#### isServer

> `readonly` **isServer**: `"typeof window === 'undefined'"` = `"typeof window === 'undefined'"`

#### localStorageKey

> `readonly` **localStorageKey**: `"PARAGLIDE_LOCALE"` = `"PARAGLIDE_LOCALE"`

#### outputStructure

> `readonly` **outputStructure**: `"message-modules"` = `"message-modules"`

#### strategy

> `readonly` **strategy**: \[`"cookie"`, `"globalVariable"`, `"baseLocale"`\]

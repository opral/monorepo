# Placeholders

Placeholders are internal variables that get resolved at a later point. This makes it more easy to inject something arbitrary into the code. Without an additional resolve logic at the time we define them.

Such placeholders are:

- `$$_INLANG_PLACEHOLDER_$$` a placeholder we can easily swap out with something else in an AST
- `$$_INLANG_LANGUAGE_$$` => `language` from `@inlang/sdk-js`
- `$$_INLANG_I_$$` => `i` from `@inlang/sdk-js`
- ... and others

---

---

---

# transform ast API

## general guidelines

- the variable `ast` is always used for the global AST of that function block

- sub-ASTs must always end with `Ast` (e.g. `ifBlockAst`)

- code blocks should be inserted as code and not as a hardcoded AST like this:

  ```ts
  const code = "console.log(123)"
  const ast = parse(code)
  const exportsGetAst = parse("export const GET = async ({ params: { language } }) => { /* */ }")
  append(ast, exportsGetAst)
  const result = serialize(ast)
  // result => 'console.log(123);export const GET = async ({ params: { language } }) => { /* */ }'
  ```

- all transform functions get an AST as an input and return an AST as an output. The functions we currently have, just act as a wrapper around the generic ast transform function. This makes it possible to create source maps at the end of the process.
  ```ts
  const ast = parse(code)
  transformPageJsAst(ast)
  return generateCode(ast).code
  ```

## `JavaScript`

- adding imports

  ```ts
  const code = "const a = 1"
  const ast = parse(code)
  imports(ast, "@inlang/core").add("$$_INLANG_I_$$", "$$_INLANG_LANGUAGE_$$")
  const result = serialize(ast)
  // result => 'import { $$_INLANG_I_$$, $$_INLANG_LANGUAGE_$$ } from "@inlang/core";const a = 1'
  ```

  ```ts
  const code = 'import { i } from "@inlang/core"'
  const ast = parse(code)
  imports(ast, "@inlang/core").add("$$_INLANG_LANGUAGE_$$")
  imports(ast, "lodash").add("merge")
  const result = serialize(ast)
  // result => 'import { i, $$_INLANG_LANGUAGE_$$ } from "@inlang/core";import { merge } from "lodash"'
  ```

- removing imports
  ```ts
  const code = 'import { i, language } from "@inlang/core"'
  const ast = parse(code)
  imports(ast, "@inlang/core").remove("language")
  const result = serialize(ast)
  // result => 'import { language } from "@inlang/core"'
  ```
  ```ts
  const code = 'import { i, language } from "@inlang/core"'
  const ast = parse(code)
  imports(ast, "@inlang/core").remove() // remove all imports
  const result = serialize(ast)
  // result => ''
  ```

## `svelte`

for script block:

- use `JavaScript` api described above

for markup block:

- inserting code blocks
  ```ts
  const markup = "<!-- some comment in the markup -->"
  const ast = parse(markup)
  const slotAst = parse("<slot />")
  append(ast, slotAst)
  const result = serialize(ast)
  // result => '<!-- some comment in the markup --><slot />'
  ```
- wrapping code blocks
  ```ts
  const markup = '<h1>i("welcome")</h1>'
  const ast = parse(markup)
  const ifAst = parse("{#if $$_INLANG_LANGUAGE_$$}$$_INLANG_PLACEHOLDER_$${/if}")
  wrap(ast, ifAst)
  const result = serialize(ast)
  // result => '{#if $$_INLANG_LANGUAGE_$$}<h1>i("welcome")</h1>{/if}'
  ```

---

---

---

# Flows

## `JavaScript`

### `hooks.server.js`

things we need to wrap: - `handle`

wrap with `initHandleWrapper` (with special case `sequence`)

### `+layout.server.js`

things we need to wrap: - `load`

if root
wrap with `initRootLayoutServerLoadWrapper`
else
wrap with `initServerLoadWrapper`

### `+page.server.js`

things we need to wrap: - `load` - individual `actions`

if load
wrap with `initServerLoadWrapper`
if actions
wrap with `initActionWrapper`

### `+server.js`

things we need to wrap:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

wrap with `initRequestHandlerWrapper`

### `+layout.js`

things we need to wrap: - `load`

if root
wrap with `initRootLayoutLoadWrapper`
else
wrap with `initLoadWrapper`

### `+page.js`

things we need to wrap: - `load`

if root
wrap with `initRootPageLoadWrapper`
else
wrap with `initLoadWrapper`

### `*.server.js`

This is not supported.

Throw a meaningful error if we encounter an import from `@inlang/sdk-js`.

### `*.js`

JavaScript files can run on the server and on the client. So we need to detect that case during runtime. `getRuntimeFromContext` will throw an error if it get's called on the server.

1.  transform imports and remove `@inlang/sdk-js` (replace with `getRuntimeFromContext`)
    ```ts
    const code = 'import { i } from "@inlang/sdk-js";const fn = () => { i("test") }'
    const ast = parse(code)
    insertGetRuntimeFromContext(ast)
    const result = serialize(ast)
    // result => 'const fn = () => { const { i } = getRuntimeFromContext();i("test") }'
    ```
    - getRuntimeFromContext calls should only happen once per function
      - right before a variable is referenced the first time
    - we need to make sure to not redeclare imports multiple times
      ```ts
      const code =
      	'import { i } from "@inlang/sdk-js";const fn = () => { console.log(123); i("test"); i("hello") }'
      const ast = parse(code)
      insertGetRuntimeFromContext(ast)
      const result = serialize(ast)
      // result => 'const fn = () => { console.log(123); const { i } = getRuntimeFromContext(); i("test"); i("hello") }'
      ```
2.  if reactive
    - wrap reactive functions with `get()`
      ```ts
      const code = 'const fn = () => { const { i } = getRuntimeFromContext();i("test") }'
      const ast = parse(code)
      wrapWithPlaceholder(ast, "load")
      const result = serialize(ast)
      // result => 'import { get } from "svelte/store";const fn = () => { const { i } = getRuntimeFromContext();get(i)("test") }'
      ```

## `svelte`

### `+layout.svelte`

1.  if root
    - import all necessary things with placeholders and from `@inlang/sdk-js` where possible
    - insert codeblocks where needed (only non-reactive) with placeholders
    - wrap markup
2.  pass everything to `*.svelte`

### `+page.svelte`

- pass everything to `*.svelte`

### `*.svelte`

1.  replace `@inlang/sdk-js` imports with `getRuntimeFromContext`
2.  resolve aliases and placeholders
3.  if reactive
    - transform `i` and `language` to `$i` and `$language`

---

# Flow details

## generic

- resolve placeholders with correct aliases and remove duplicate imports
  ```ts
  import { i as x, $$_INLANG_I_$$ } from "@inlang/core"
  $$_INLANG_I_$$("hello")
  const y = () => {
  	$$_INLANG_I_$$("hello")
  	const inlang = $$_INLANG_I_$$
  	inlang("hello")
  }
  // =>
  import { i as x } from "@inlang/core"
  x("hello")
  const y = () => {
  	x("hello")
  	const inlang = x
  	inlang("hello")
  }
  ```
  ```ts
  import { i as inlang, $$_INLANG_I_$$ } from "@inlang/core"
  $$_INLANG_I_$$("hello")
  // =>
  import { i as inlang } from "@inlang/core"
  inlang("hello")
  ```

## wrap functionality

Wrapping `load`, individual `actions` and `RequestHandler` is identical. Only `handle` has the special case with `sequence`. so the `findLeaf` functionality must be different. The rest stays the same.

1.  if no import from `@inlang/sdk-js` exists

    - return input code without any transformation

      - except for the `handle` function; we ALWAYS need to wrap it

        ```ts
        const fn1 = () => {}
        export const handle = fn1
        // =>
        export const handle = initHandleWrapper().wrap(fn1)
        ```

        ```ts
        export const handle = sequence(fn1, fn2)
        // =>
        export const handle = initHandleWrapper().wrap(sequence(fn1, fn2))
        ```

        we will wrap the `sequence` function so we can assure that we can use `handle` functions that get declared outside of the `hooks.server.js` file.

        We can implement a generic rule that says, everything `handle` references (also an external function), we just wrap it. So we can handle `sequence` and `handle` the same way.

        ```ts
        import { appendFunctionality } from "./utils.js"
        export const handle = appendFunctionality(() => {}) // handle it the same as sequence
        // =>
        export const handle = initHandleWrapper().wrap(appendFunctionality(() => {}))
        ```

        The only difference is, that we track functions that get passed to `sequence` to resolve imports from `@inlang/sdk-js` by wrapping those functions. Because we don't know the function signature of other external functions, we can't do it there.

2.  pass code to generic `wrap` function
    - function traverses the AST and finds the export, traverses it's aliases
    - if leaf function does not use any import from `@inlang/sdk-js`
      - special case `handle` with `sequence` where we ALWAYS wrap (see above)
      - return input code (AST without any transformation)
      - this is NOT supported
        ```ts
        import { i } from "@inlang/sdk-js"
        export const load = () => {
        	fn()
        }
        const fn = () => {
        	i("test")
        }
        ```
    - else
      - wrap the leaf function with a placeholder
        ```ts
        const code =
        	'import { i } from "@inlang/sdk-js";const fn = () => { i("test") };const ld = fn;export const load = ld'
        const ast = parse(code)
        wrapWithPlaceholder(ast, "load")
        const result = serialize(ast)
        // result => 'import { i } from "@inlang/sdk-js";const fn = $$_INLANG_PLACEHOLDER_$$(() => { i("test") });const ld = fn;export const load = ld'
        ```
      - rewrite parameter e.g.
        ```ts
        `() => { i("test") }` => `(_, { i }) => { i("test") }`
        `(event) => { i("test") }` => `(event, { i }) => { i("test") }`
        `({ locals }) => { i("test") }` => `({ locals }, { i }) => { i("test") }`
        ```
        - `_` needs to be variable name that does not exist in the outer scope
3.  look if any import from `@inlang/sdk-js` get's used outside of a placeholder wrapper
    - if yes => throw meaningful error
4.  remove imports from `@inlang/sdk-js`
5.  import all necessary things
6.  replace placeholder with specific function of that file
    ```ts
    const code = 'const fn = $$_INLANG_PLACEHOLDER_$$((_, { i }) => { i("test") });'
    const wrapperAst = parse('initHandleWrapper({ key: "value" }).wrap($$_INLANG_PLACEHOLDER_$$)')
    wrap(ast, wrapperAst)
    const result = serialize(ast)
    // result => 'const fn = initHandleWrapper({ key: "value" }).wrap((_, { i }) => { i("test") });'
    ```

The wrap function needs to work with the following code snippets:

```ts
const load = () = {}
```

```ts
function load = () = {}
export { load }
```

```ts
const fn = () = {}
export { fn as load }
```

```ts
const fn1 = () = {}
const fn2 = fn1
const fn3 = fn2
export const load = fn3
```

```ts
const fn1 = () = {}
const fn2 = function () { }
export const load = sequence(fn1, fn2)
```

```ts
const load: PageLoad = () => {}
```

```ts
const load = (() => {}) satisfies PageLoad
```

```ts
import { appendFunctionality } from "./utils.js"
export const load = appendFunctionality(() => {}) // handle it the same as sequence
```

The wrap function does not consider these cases:

```ts
const fn1 = () = {}
const fn2 = fn1
const fn3 = otherFunction(fn2) // this is not supported
export const load = fn3
```


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
	const code = 'console.log(123)'
	const ast = parse(code)
	const exportsGetAst = parse('export const GET = async ({ params: { language } }) => { /* */ }')
	append(ast, exportsGetAst)
	const result = serialize(ast)
	// result => 'console.log(123);export const GET = async ({ params: { language } }) => { /* */ }'
	```

## `JavaScript`

 - adding imports
	```ts
	const code = 'const a = 1'
	const ast = parse(code)
	imports(ast, '@inlang/core').add('i', 'language')
	const result = serialize(ast)
	// result => 'import { i, language } from "@inlang/core";const a = 1'
	```
	```ts
	const code = 'import { i } from "@inlang/core"'
	const ast = parse(code)
	imports(ast, '@inlang/core').add('language')
	imports(ast, 'lodash').add('merge')
	const result = serialize(ast)
	// result => 'import { i, language } from "@inlang/core";import { merge } from "lodash"'
	```

 - removing imports
	```ts
	const code = 'import { i, language } from "@inlang/core"'
	const ast = parse(code)
	imports(ast, '@inlang/core').remove('language')
	const result = serialize(ast)
	// result => 'import { language } from "@inlang/core"'
	```
	```ts
	const code = 'import { i, language } from "@inlang/core"'
	const ast = parse(code)
	imports(ast, '@inlang/core').remove() // remove all imports
	const result = serialize(ast)
	// result => ''
	```

## `svelte`

for script block:
 - use `JavaScript` api described above

for markup block:
 - inserting code blocks
   ```ts
	const markup = '<!-- some comment in the markup -->'
	const ast = parse(markup)
	const slotAst = parse('<slot />')
	append(ast, slotAst)
	const result = serialize(ast)
	// result => '<!-- some comment in the markup --><slot />'
	```
 - wrapping code blocks
   ```ts
	const markup = '<h1>i("welcome")</h1>'
	const ast = parse(markup)
	const ifAst = parse('{#if $$_INLANG_LANGUAGE_$$}<!-- $$_INLANG_PLACEHOLDER_$$ -->{/if}')
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

things we need to wrap:
	- `handle`

wrap with `initHandleWrapper`

### `+layout.server.js`

things we need to wrap:
	- `load`

if root
	wrap with `initRootLayoutServerLoadWrapper`
else
	wrap with `initServerLoadWrapper`

### `+page.server.js`

things we need to wrap:
	- `load`
	- individual `actions`

if load
	wrap with `initServerLoadWrapper`
if actions
	wrap with `initActionWrapper`

### `+server.js`

things we need to wrap:
 - `POST`
 - `PUT`
 - `PATCH`
 - `DELETE`
 - `OPTIONS`

wrap with `initRequestHandlerWrapper`

### `+layout.js`

things we need to wrap:
	- `load`

if root
	wrap with `initRootLayoutLoadWrapper`
else
	wrap with `initLoadWrapper`

### `+page.js`

things we need to wrap:
	- `load`

if root
	wrap with `initRootPageLoadWrapper`
else
	wrap with `initLoadWrapper`

### `*.server.js`

This is not supported.

Throw a meaningful error if we encounter an import from `@inlang/sdk-js`.

### `*.js`

JavaScript files can run on the server and on the client. So we need to detect that case during runtime. `getRuntimeFromContext` will throw an error if it get's called on the server.

 - transform imports
	```ts
	const code = 'import { i } from "@inlang/sdk-js";const fn = () => { i("test") }'
	const ast = parse(code)
	wrapWithPlaceholder(ast, 'load')
	const result = serialize(ast)
	// result => 'const fn = () => { const { i } = getRuntimeFromContext();i("test") }'
	```
 - getRuntimeFromContext calls should only happen once per function
  		 - right before a variable is referenced the first time
 - we need to make sure to not redeclare imports multiple times
	```ts
	const code = 'import { i } from "@inlang/sdk-js";const fn = () => { console.log(123); i("test"); i("hello") }'
	const ast = parse(code)
	wrapWithPlaceholder(ast, 'load')
	const result = serialize(ast)
	// result => 'const fn = () => { console.log(123); const { i } = getRuntimeFromContext();i("test"); i("hello") }'
	```
 - if reactive
    - wrap reactive functions with `get()`
		```ts
		const code = 'const fn = () => { const { i } = getRuntimeFromContext();i("test") }'
		const ast = parse(code)
		wrapWithPlaceholder(ast, 'load')
		const result = serialize(ast)
		// result => 'import { get } from "svelte/store";const fn = () => { const { i } = getRuntimeFromContext();get(i)("test") }'
		```


## `svelte`

### `+layout.svelte`

 - if root
    - import all necessary things
    - insert codeblocks where needed (only non-reactive)
    - wrap markup
 - pass everything to `*.svelte`

### `+page.svelte`

 - pass everything to `*.svelte`

### `*.svelte`

 - replace `@inlang/sdk-js` imports with `getRuntimeFromContext`
 - resolve aliases and placeholders
 - if reactive
   - transform `i` and `language` to `$i` and `$language`

---

# Flow details

## wrap functionality

Wrapping `load`, individual `actions` and `RequestHandler` is identical. Only `handle` has the special case with `sequence`. so the `findLeaf` functionality must be different. The rest stays the same.
 - if no import from `@inlang/sdk-js` exists
    - return input code without any transformation

 - pass code to generic `wrap` function
    - function traverses the AST and finds the export, traverses it's aliases
    - if leaf function does not use any import from `@inlang/sdk-js`
       - return input code
    - else
       - wrap the leaf function with a placeholder
		 	```ts
			const code = 'import { i } from "@inlang/sdk-js";const fn = () => { i("test") };const ld = fn;export  const load = ld'
			const ast = parse(code)
			wrapWithPlaceholder(ast, 'load')
			const result = serialize(ast)
			// result => 'import { i } from "@inlang/sdk-js";const fn = $$_INLANG_PLACEHOLDER_$$(() => { i("test") });const ld = fn;export const load = ld'
			```
	    - rewrite parameter e.g.
			```ts
			`() => { i("test") }` => `(_, { i }) => { i("test") }`
			`(event) => { i("test") }` => `(event, { i }) => { i("test") }`
			`({ locals }) => { i("test") }` => `({ locals }, { i }) => { i("test") }`
			```
 - look if any import from `@inlang/sdk-js` get's used outside of a placeholder wrapper
    - if yes => throw meaningful error
 - remove imports from `@inlang/sdk-js`
 - import all necessary things
 - replace placeholder with specific function of that file
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
import { appendFunctionality } from './utils.js'
export const load = appendFunctionality(() => { })
```

```ts
const load: PageLoad = () => {}
```

```ts
const load = (() => {}) satisfies PageLoad
```

# Flows

## `JavaScript`

### `hooks.server.js`

things we need to wrap:
	- `handle`

### `+layout.server.js`

things we need to wrap:
	- `load`

### `+page.server.js`

things we need to wrap:
	- `load`
	- individual `actions`

### `+server.js`

things we need to wrap:
 - `POST`
 - `PUT`
 - `PATCH`
 - `DELETE`
 - `OPTIONS`

### `+page.js`

### `+layout.js`

### `*.js`
#### `server`
#### `client`


---

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
---
---

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
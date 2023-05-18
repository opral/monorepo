# Flows

## `JavaScript`

### `hooks.server.js`

### `+layout.server.js`

### `+page.server.js`

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

# transform ast API

## `JavaScript`

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
	const code = serialize(ast)
	// code => '<!-- some comment in the markup --><slot />'
	```
 - wrapping code blocks
   ```ts
	const markup = '<h1>i("welcome")</h1>'
	const ast = parse(markup)
	const ifAst = parse('{#if $$_INLANG_LANGUAGE_$$}<!-- $$_INLANG_WRAP_PLACEHOLDER_$$ -->{/if}')
	wrap(ast, ifAst)
	const code = serialize(ast)
	// code => '{#if $$_INLANG_LANGUAGE_$$}<h1>i("welcome")</h1>{/if}'
	```
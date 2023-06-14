# Placeholders

Placeholders are internal variables that get resolved at a later point. This makes it more easy to inject something arbitrary into the code. Without an additional resolve infoic at the time we define them.

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
  const code = "console.info(123)"
  const ast = parse(code)
  const exportsGetAst = parse("export const GET = async ({ params: { language } }) => { /* */ }")
  append(ast, exportsGetAst)
  const result = serialize(ast)
  // result => 'console.info(123);export const GET = async ({ params: { language } }) => { /* */ }'
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
  replacePlaceholder(ast, ifAst)
  const result = serialize(ast)
  // result => '{#if $$_INLANG_LANGUAGE_$$}<h1>i("welcome")</h1>{/if}'
  ```

---

---

---

# Flows

## `Javascript` and `Svelte`

There is some stuff that has to be done both in javascript AND every svelte file:

Possible implementation:

```ts
const inlangSdkStores = ["i", "language"]

function wrapAndAddParameters(
	ast,
	config,
	wrappers: (
		| "initHandleWrapper"
		| "initRootLayoutServerLoadWrapper"
		| "initServerLoadWrapper"
		| "initActionWrapper"
		| "initRequestHandlerWrapper"
		| "initRootLayoutLoadWrapper"
		| "initLoadWrapper"
		| "initRootPageLoadWrapper"
	)[],
) {
	wrappers.forEach((wrapper) => {
		let identifier
		let wrapperAst
		switch (wrapper) {
			case "initHandleWrapper":
				identifiers = ["handle"]
				wrapperAst = parse(`${wrapper}(/*options here*/).use`)
				importFrom = "@inlang/sdk-js/adapter-sveltekit/server"
				break
			case "initServerLoadWrapper":
			case "initRootLayoutServerLoadWrapper":
				identifiers = ["load"]
				wrapperAst = parse(`${wrapper}(/*options here*/).use`)
				importFrom = "@inlang/sdk-js/adapter-sveltekit/server"
				break
			case "initRootLayoutLoadWrapper":
			case "initRootPageLoadWrapper":
			case "initLoadWrapper":
				identifiers = ["load"]
				wrapperAst = parse(`${wrapper}(/*options here*/).use`)
				importFrom = "@inlang/sdk-js/adapter-sveltekit/shared"
				break
			case "initRequestHandlerWrapper":
				identifiers = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
				wrapperAst = parse(`${wrapper}(/*options here*/).use`)
				importFrom = "@inlang/sdk-js/adapter-sveltekit/server"
				break
			case "initActionWrapper":
				identifiers = ["actions"]
				wrapperAst = parse(`${wrapper}(/*options here*/).use`)
				importFrom = "@inlang/sdk-js/adapter-sveltekit/server"
				break
			default:
				break
		}
		// Wrap the specified functions
		const wasWrapped = definitions(ast, ...identifiers)
			.use(wrapperAst)
			.successful()
		// Add imports
		if (wasWrapped) imports(ast, importFrom).add(wrapper)
	})
	// At this point the @inlang/sdk-js import is not removed yet
	// Ensure that function parameters are correct
	const aliases = imports(ast, "@inlang/sdk-js").getAliases()
	const exportToPlaceholder = (exportN: string) => {
		switch (exportN) {
			case "loadResource":
				return "$$_INLANG_LOAD_RESOURCE_NON_REACTIVE_$$"
			case "switchLanguage":
				return "$$_INLANG_SWITCH_LANGUAGE_NON_REACTIVE_$$"
			case "language":
				return "$$_INLANG_LANGUAGE_NON_REACTIVE_$$"
			case "i":
				return "$$_INLANG_I_NON_REACTIVE_$$"
			case "languages":
				return "$$_INLANG_REFERENCE_LANGUAGE_NON_REACTIVE_$$"
			case "referenceLanguage":
				return "$$_INLANG_REFERENCE_LANGUAGE_NON_REACTIVE_$$"
			default:
				return
		}
	}
	for (const { exportN } of aliases) {
		contexts(ast, exportN)
			.isFunction()
			.merge(parse(`function(_, {${exportToPlaceholder(exportN)}}) {}`))
	}
}

// Returns either $$_INLANG_I_ALIAS_$$ for non reactive and $$_INLANG_I_$$ for reactive imports
function getImportPlaceholders(aliases) {
	const constructObject = (
		exportN: string /*can be `i` or any other import from sdk*/,
		aliasN: string,
	) => {
		return {
			aliasN: aliasN,
			placeholder: `$$_INLANG_${exportN.toUpperCase()}${
				!inlangSdkStores.includes(exportN) ? "_NON_REACTIVE" : ""
			}_$$`,
		}
	}
	return aliases.map(({ exportN, aliasN }) => constructObject(exportN, aliasN))
}

function replaceSdkImports(ast) {
	// Prunes the imports, i.e. merge duplicates.
	// Then remove sdk imports, but save the aliases: import {i as iAlias} ... returns [{exportN: string, aliasN: string}, ...]
	const aliases = imports(ast, "@inlang/sdk-js").getAliases()
	imports(ast, "@inlang/sdk-js").remove()
	const importPlaceholders = getImportPlaceholders(aliases)
	// Replace imported aliases with placeholders
	for (const { aliasN, placeholder } of importPlaceholders) {
		identifiers(ast, aliasN).replace(parse(placeholder))
	}
	// Declare all aliases from sdk-import: `let iAlias`, `let languageAlias`, ...
	// Assign `({ i } = getRuntimeFromContext())` in each context of iAlias (or $iAlias in reactive case).
	contexts(ast).insertAfterImports(
		parse(`
      $$_INLANG_DECLARE_SDK_IMPORTS_$$;
      $$_INLANG_REASSIGN_SDK_IMPORTS_$$;
    `),
	)
	return aliases
}
function replacePlaceholders({
	ast,
	magicString,
	config,
	fileType,
}: {
	ast: Node
	magicString?: MagicString
	config
	fileType: "svelte" | "js"
}) {
	imports(
		ast,
		`@inlang/sdk-js/adapter-sveltekit/client/${config.languageInUrl ? "not-" : ""}reactive`,
	).add("getRuntimeFromContext")
	// Replace $$_INLANG_REASSIGN_SDK_IMPORTS_$$
	identifiers({ ast, magicString }, "$$_INLANG_REASSIGN_SDK_IMPORTS_$$").replace(
		parse(`
      ({
        ${aliases.map(({ exportN, aliasN }) => `${exportN}:${aliasN}`).join(",")}
      } = getRuntimeFromContext());
    `),
	)
	// Replace $$_INLANG_DECLARE_SDK_IMPORTS_$$
	identifiers({ ast, magicString }, "$$_INLANG_DECLARE_SDK_IMPORTS_$$").replace(
		parse(`
      let ${aliases.map(({ exportN, aliasN }) => `${aliasN}`).join(",")}
    `),
	)
	// Replace placeholders from sdk-js import, language
	identifiers({ ast, magicString }, "$$_INLANG_LANGUAGE_$$").replace(
		parse(
			!config.languageInUrl ? (fileType === "svelte" ? "$language" : "get(language)") : "language",
		),
	)
	// non reactive language
	identifiers({ ast, magicString }, "$$_INLANG_LANGUAGE_NON_REACTIVE_$$").replace(parse("language"))
	// Replace placeholders from sdk-js import, i, reactive
	identifiers({ ast, magicString }, "$$_INLANG_I_$$").replace(
		parse(!config.languageInUrl ? (fileType === "svelte" ? "$i" : "get(i)") : "i"),
	)
	// non reactive i
	identifiers({ ast, magicString }, "$$_INLANG_I_NON_REACTIVE_$$").replace(parse("i"))
	// Replace placeholders from sdk-js import, languages
	identifiers({ ast, magicString }, "$$_INLANG_LANGUAGES_$$").replace(parse("languages"))
}
```

## `JavaScript`

### `hooks.server.js`

things we need to wrap: - `handle`

wrap with `initHandleWrapper` (with special case `sequence`)

Possible implementation:

```js
function transformHooksServerJsAst(ast, config) {
	// Wrap handle function
	wrapAndAddParameters(ast, config, ["initHandleWrapper"])
	transformJs(ast, config)
	return ast
}
```

### `+layout.server.js`

things we need to wrap: - `load`

- `if root` wrap with `initRootLayoutServerLoadWrapper`
- `else` wrap with `initServerLoadWrapper`

Possible implementation:

```js
function transformLayoutServerJsAst(ast, config) {
	wrapAndAddParameters(ast, config, [
		config.isRoot ? "initRootLayoutServerLoadWrapper" : "initServerLoadWrapper",
	])
	transformJs(ast, config)
	return ast
}
```

### `+page.server.js`

things we need to wrap: - `load` - individual `actions`

- `if load` wrap with `initServerLoadWrapper`
- `if actions` wrap with `initActionWrapper`

Possible implementation:

```js
function wrap(ast, config, exportName) {}

function transformPageServerJsAst(ast, config) {
	wrapAndAddParameters(ast, config, ["initServerLoadWrapper", "initActionWrapper"])
	transformJs(ast, config)
	return ast
}
```

### `+server.js`

things we need to wrap:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

wrap with `initRequestHandlerWrapper`

Possible implementation:

```js
function transformServerJsAst(ast, config) {
	// Wrap GET, POST, PUT, PATCH, DELETE & OPTIONS function
	wrapAndAddParameters(ast, config, ["initRequestHandlerWrapper"])
	transformJs(ast, config)
	return ast
}
```

### `+layout.js`

things we need to wrap: - `load`

- `if root` wrap with `initRootLayoutLoadWrapper`
- `else` wrap with `initLoadWrapper`

Possible implementation:

```js
function transformLayoutJsAst(ast, config) {
	wrapAndAddParameters(ast, config, [
		config.isRoot ? "initRootLayoutLoadWrapper" : "initLoadWrapper",
	])
	transformJs(ast, config)
	return ast
}
```

### `+page.js`

things we need to wrap: - `load`

- `if root` wrap with `initRootPageLoadWrapper`
- `else` wrap with `initLoadWrapper`

Possible implementation:

```js
function transformPageJsAst(ast, config) {
	wrapAndAddParameters(ast, config, [config.isRoot ? "initRootPageLoadWrapper" : "initLoadWrapper"])
	transformJs(ast, config)
	return ast
}
```

### `*.server.js`

This is not supported.

Throw a meaningful error if we encounter an import from `@inlang/sdk-js`.

Possible implementation:

```js
function transformGenericServerJsAst(ast, config) {
	// The below assert function throws
	const { aliases } = imports(ast, "@inlang/sdk-js").getAliases()
	if (aliases.size !== 0) throw new Error()
}
```

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
      	'import { i } from "@inlang/sdk-js";const fn = () => { console.info(123); i("test"); i("hello") }'
      const ast = parse(code)
      insertGetRuntimeFromContext(ast)
      const result = serialize(ast)
      // result => 'const fn = () => { console.info(123); const { i } = getRuntimeFromContext(); i("test"); i("hello") }'
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

Possible implementation:

```js
function transformJs(ast, config) {
	replaceSdkImports(ast)
	replacePlaceholders({ ast, config, fileType: "js" })
}
```

## `svelte`

### `+layout.svelte`

1. if root

   1. import all necessary things with placeholders and from `@inlang/sdk-js` where possible
      (`getRuntimeFromContext` is imported by `transformSvelte` in a later step):

      1. Imports always required:

      ```ts
      import { $$_INLANG_LANGUAGE_$$ } from "@inlang/sdk-js"
      import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
      ```

      2. Special cases:

      - if `config.languageInUrl`:
        ```ts
        import { addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
        ```
      - else:
        ```ts
        import {
        	localStorageKey,
        	addRuntimeToContext,
        } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
        import { browser } from "$app/environment"
        ```

      ```

      ```

   2. insert codeblocks where needed (only non-reactive) with placeholders

      1. Declare `export let data` and `addRuntimeToContext(getRuntimeFromData(data));` after the last import
      2. If `!config.languageInUrl`: make aliases from sdk-js import reactive (insert the following code block before first usage of ):

      ```ts
      $: {
      	addRuntimeToContext(getRuntimeFromData(data))
      	$$_INLANG_REASSIGN_SDK_IMPORTS_$$
      }
      ```

   3. Add `<slot />` if markup is empty (only comments or newline-ish chars)
   4. wrap markup (the reactive $ will be added by `transformSvelte`)
      1. if `config.languageInUrl && config.isStatic` with `{#if $$_INLANG_LANGUAGE_$$}{/if}`
      2. if `config.languageInUrl` with `{#key $$_INLANG_LANGUAGE_$$}{/key}`, else `{#if $$_INLANG_LANGUAGE_$$}{/if}`

2. Pass everything to `transformSvelte`

Possible implementation:

```js
// NOTES @benjaminpreiss I am not sure whether we can pull `module` out of the preprocessing api
function transformLayoutSvelte({ markup, style, script }, config) {
	// Import all necessary things
	if (config.isRoot) {
		imports(script.ast, "@inlang/sdk-js/adapter-sveltekit/shared").add("getRuntimeFromData")
		imports(
			script.ast,
			`@inlang/sdk-js/adapter-sveltekit/client/${config.languageInUrl ? "not-" : ""}reactive`,
		).add("addRuntimeToContext")
		if (!config.languageInUrl)
			imports(script.ast, "@inlang/sdk-js/adapter-sveltekit/client/reactive").add("localStorageKey")

		// Insert reactive inlang sdk import reassigments
		if (!config.languageInUrl)
			contexts(script.ast).insertAfterImports(
				parse(`
          $: {
            addRuntimeToContext(getRuntimeFromData(data));
            $$_INLANG_REASSIGN_SDK_IMPORTS_$$;
          }
        `),
			)
		// Insert `export let data` and `addRuntimeToContext(getRuntimeFromData(data));`
		// As you can see, contexts() with only one param returns the top level context
		contexts(script.ast).insertAfterImports(
			parse(`
        export let data;
        addRuntimeToContext(getRuntimeFromData(data));
      `),
		)
		// Insert slot, only if markup is empty
		if (isEmpty(script.markup)) contexts(markup).insert(`<slot/>`)
		// Insert a conditional
		if (config.languageInUrl && config.isStatic)
			contexts(markup).use(`{#if $$_INLANG_LANGUAGE_$$}`, `{/if}`)
		contexts(markup).use(
			`{#${config.languageInUrl ? "key" : "if"} $$_INLANG_LANGUAGE_$$}`,
			`{/${config.languageInUrl ? "key" : "if"}}`,
		)
	}
	transformSvelte({ markup, style, script }, config)
	return { markup: markup.ast, style, script }
}
```

### `+page.svelte`

- pass everything to `*.svelte`

Possible implementation:

```ts
function transformPageSvelte(
	{
		markup,
		style,
		script,
	}: { markup: { ast: Node; magicString: MagicString }; style: Node; script: { ast: Node } },
	config,
) {
	transformSvelte({ markup, style, script }, config)
	return { markup: markup.ast, style, script }
}
```

### `*.svelte`

1.  replace `@inlang/sdk-js` imports with `getRuntimeFromContext`
2.  Add import:

    - if `config.languageInUrl`: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"`
    - else: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"`

3.  resolve aliases and placeholders `// NOTES @ivanhofer - what do you mean with this step?`
4.  if reactive
    - transform `i` and `language` to `$i` and `$language`

Possible implementation:

```ts
function transformSvelte(
	{
		markup,
		style,
		script,
	}: { markup: { ast: Node; magicString: MagicString }; style: Node; script: { ast: Node } },
	config,
) {
	// This needs to run first, as we replace all occurrences from the sdk imports with placeholders
	replaceSdkImports(script.ast)
	replacePlaceholders({ ast: script.ast, config, fileType: "svelte" })
	replacePlaceholders({ ...markup, config, fileType: "svelte" })
	return { markup: markup.ast, style, script }
}
```

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
        export const handle = initHandleWrapper().use(fn1)
        ```

        ```ts
        export const handle = sequence(fn1, fn2)
        // =>
        export const handle = initHandleWrapper().use(sequence(fn1, fn2))
        ```

        we will wrap the `sequence` function so we can assure that we can use `handle` functions that get declared outside of the `hooks.server.js` file.

        We can implement a generic rule that says, everything `handle` references (also an external function), we just wrap it. So we can handle `sequence` and `handle` the same way.

        ```ts
        import { appendFunctionality } from "./utils.js"
        export const handle = appendFunctionality(() => {}) // handle it the same as sequence
        // =>
        export const handle = initHandleWrapper().use(appendFunctionality(() => {}))
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
    const wrapperAst = parse('initHandleWrapper({ key: "value" }).use($$_INLANG_PLACEHOLDER_$$)')
    replacePlaceholder(ast, wrapperAst)
    const result = serialize(ast)
    // result => 'const fn = initHandleWrapper({ key: "value" }).use((_, { i }) => { i("test") });'
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

# Required AST helpers

We summarize the required methods to manipulate the ast:

## General

Every helper...

- Accepts the following params:

  ```ts
  function helper(target: { ast: Node; magicString: MagicString } | Node, ...otherParams)
  ```

  The first param can either be an ast or an object containing an ast and a magicstring. In case of an object being passed, all ast manipulations happen on the magicstring and the AST is just used for finding the insertion position.

- The complete set of chained operators should be available at all times. E.g. although different in effect (and possibly nonsensical) a user could call both `.isFunction().merge()` or `.merge().isFunction()`

- For the future the goal would be to enable idempotency, meaning that calling the same code multiple times still leads to the same endresult

## Imports

```ts
const {result} = imports(...).add(wrapper)
imports(ast, importFrom).add(wrapper).getAliases()
const {aliases, error} = imports(ast, "@inlang/sdk-js").getAliases()
imports(ast, "@inlang/sdk-js").removeAll()
imports(
	ast,
	`@inlang/sdk-js/adapter-sveltekit/client/${config.languageInUrl ? "not-" : ""}reactive`,
).add("getRuntimeFromContext")
```

## Definitions

```ts
const wasWrapped = definitions(ast, ...identifiers)
	.use(wrapperAst)
	.successful()
```

## Contexts

```ts
contexts(ast, exportN)
	.isFunction()
	.merge(parse(`function(_, {${exportToPlaceholder(exportN)}}) {}`))
contexts(ast).insertAfterImports(
	parse(`
      $$_INLANG_DECLARE_SDK_IMPORTS_$$;
      $$_INLANG_REASSIGN_SDK_IMPORTS_$$;
    `),
)
contexts(markup).insert(`<slot/>`)
contexts(markup).use(`{#if $$_INLANG_LANGUAGE_$$}`, `{/if}`)
// Returns true or false if identifier is declarable
contexts(ast).isDeclarable(identifier)
// Returns an alternative, auto-generated identifier that is declarable
contexts(ast).findDeclarable(identifier)
```

## Identifiers

```ts
identifiers(ast, aliasN).replace(parse(placeholder))
identifiers({ ast, magicString }, "$$_INLANG_LANGUAGE_NON_REACTIVE_$$").replace(parse("language"))
```

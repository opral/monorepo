# RFC for `@inlang/sdk`

This package will provide an SDK on top of inlang for different frameworks and meta-frameworks.
The RFC is the first draft on how this could look like.

## Goals of this package

- the SDK should become the go-to solution for i18n
  - should be easy to integrate (a minimum amount of steps required)
  - should provide reasonable defaults (SSR, caching assets, etc.) and edge cases (shared state on server, etc.)
  - should be configurable depending on user's needs
- for now we focus on delivering a great SDK for `SvelteKit`
  - the SvelteKit community has no great i18n solution yet
  - out of all frameworks, we have the best knowledge of `SvelteKit`
- at a later point the SDK should also work with plain `Svelte` and other (meta-)frameworks

## Won't do's (for now)

- optimizations
  - we just read all `Resource`s via the `inlang.config.js` and use that `AST` at runtime
    - optimizing (minimizing) the `AST` can be an improvement for the future
  - we don't split `Resource`s into route-specific parts
- come up with a generic way to do things
  - we focus on `SvelteKit` and will experiment with common `Svelte` concepts
  - coming up with a cross-framework solution can be done when we make the SDK compatible with other frameworks
- typesafety for the lookup function
  - this should probably not be part of the SDK itself, but there could exist a package that reads a `Resource` and outputs `TypeScript` type definitions
  - could also work for other programming languages
- format functions, switch-case, plurals, pronouns, gender rules and other common i18n library stuff
  - `inlang` currently only has the concepts of plain strings, so we leave that out for now
  - but the `inlang` `AST` should at least be extended with the concept of `parameters`
  - formatter functions probably need to be a concept for the full inlang ecosystem. So translators can already see how the formatted string will look in the UI
- localizing routes e.g. `en/settings` => `de/einstellungen`
  - this is a content problem and not a translation problem. `inlang` just serves translations and not content (at least currently).
  - we could come up with an approach and provide some guides how to set it up in any project
  - potential questions:
    - how do we link to the correct page in multiple languages?
    - how to transform `<a href="/en/settings">Settings</a>` to `<a href="/de/einstellungen">Einstellungen</a>`?
    - routes could collide; Some words exist in different languages and can have different meanings
      - e.g. the link `/bank` could lead to the english and german version. If the language is not encoded in the url, how do we render the correct language?
    - some routes may not exist in certain languages
    - layouts could differ between languages (a simple if/else should be good enough to support that use case)

## How this SDK should function

### runtime

The SDK should include some core functionality (called `runtime`) that can be shared across all frameworks.

> By exposing the `runtime` functionality, other developers could use it to build their own i18n solution that is compatible with `inlang` for any given framework.

Runtime functionality will be:

- `loadResource`: function that [loads a `Resource`](#loading-resources)
- `changeLanguage`: function to change language
- the [`lookup function`](#lookup-function)
- a function to create [`alternate` links](#alternate-links)

The `runtime` functions itself will not deal with reactivity. They just store `Resource`s in memory and the lookup function accesses them.

### adapters

On top of the core functionality we will have framework-specific implementations that will use the `runtime` functionality to deliver a tailored i18n experience.
An adapter will provide a build plugin (vite, rollup, webpack, etc. via [`unplugin`](https://github.com/unjs/unplugin)). This build plugin will inject `runtime` functionality at specific parts of the codebase. Because most meta-frameworks have a convention-based setup, we can detect where to put things and how to best configure the framework to add i18n functionality. More information [here](#implementation-details-with-plugin)

The adapter is also responsible to add reactivity to the `runtime` functionality where needed or if wanted by the developer (via a configuration option). An adapter will re-export the same functions as the `runtime` package does.

Per default no reactivity gets used as it only makes sense for SPAs. If the language get's encoded into the url, then a simple redirect is better than to change the language client-side. Changing language is a rarely performed action and users will probably not expect that the page get's immediately updated. A page navigation is good enough.

### loading resources

Resources will be loaded from disk via the functions provided by `inlang.config.js`. Once loaded the `Resource`s will be kept in memory. A server then can transform (and in the future also optimize) those `Resource`s because it does not make sense to ship all `Resource`s to the client. This all happens during runtime, so we will probably also need to provide an `GET` endpoint so the client can load the optimized Resources from the server.

In an ideal world we will always have all data needed. But in reality, things may be missing from a certain `Resource`. In that case, we transform the `Resource`s and include the reference if a `Id` is missing.

### lookup function

The lookup function will be the only thing that a developer needs to add to the source code. This function get's passed an `Id`, traverses the `AST` and returns a translated `Message`.

The SDK will provide that function as the default export, so anyone can name it however he wants. We can also export some common aliases so users get useful auto-import capabilities from the IDE.

This lookup function needs to be called with an `Id` e.g. like this:

```ts
i("welcome", { name: "Inlang" })
```

### alternate links

[Alternate links](https://developers.google.com/search/docs/specialty/international/localized-versions?hl=de) are an important way to tell search engines that this page exists in multiple languages.

If we don't care about localized routes, we can auto-generate them. `inlang` knows about all languages a project can have. An url will just slightly change depending on the [`language detection`](#language-detection) strategy.

If developers want to customize the behavior, they can manually call a `setAlternateLink` function.

The adapter should auto-inject this metadata into the rendered HTML.

### configuration

Internationalization can be done in many different ways. Some things will work across all strategies e.g. how to display a translated `Message` on screen (see [lookup function](#lookup-function)). But other things need to be configured because each company/team may have it's own opinion how on things should work.

That's why we need some kind of configuration options that an adapter can parse and follow to output different behavior.

Having those options in the `inlang.config.js` means that the configuration can be moved to a different repository with any other framework and (as long as there exists an SDK for that) we will have the same i18n experience without setting up anything other than the adapter.

Configuration options can be:

#### language detection

There are many ways how to detect the language that should be used:

- `rootSlug` (default): e.g. `www.inlang.com/de/docs` with option to leave out the reference language
- `TLD`: e.g. `www.inlang.de/docs`
- `subdomain`: e.g. `de.inlang.com/docs`
- `queryParameter`: e.g. `www.inlang.com/docs?lang=de`
- auto-detection
  - `acceptLanguageHeader`: e.g. `'accept-language: en;q=0.8, de;q=0.7, *;q=0.5'`
  - `cookie`: reads a cookie value
  - `header`: e.g. read the Cloudflare `CF-IPCountry` header
  - `navigator`: for SPAs to get the language information client-side
  - others not mentioned here, can be easily added
- other functions that should be left to user land and therefore will not be part of the configuration
  - get country information from the user's IP address
  - get language information from the user object stored in DB
  - custom; some things we didn't think of

We can find better names for those strategies once we implement them.

There is the need to support multiple strategies. If the first one does not match, the next strategies will be tried until a match is found. If nothing matches, the `sourceLanguageTag` will be used.

Setting up auto detection is optional. Developers can also just call the `changeLanguage` function directly.

Each strategy will need a special framework agnostic implementation, to pass the necessary information to those detection functions.

For the first version we probably won't need all of the strategies. We will implement `rootSlug`, `acceptLanguageHeader` and `navigator` to cover a majority of use cases.

#### config structure

The configuration object could look like this:

_inlang.config.js_

```ts
const config = {
	sdk: {
		adapter: {
			SvelteKit: {
				// ... SvelteKit specific options if there are any
			},
		},
		alternateLinks: false, // turn feature off
		languageDetection: [
			{
				type: "rootSlug",
			},
			{
				type: "cookie",
				// can / needs to be configured
				name: "lang",
			},
		],
	},
}
```

## Error handling

The adapter should also warn if something was not configured correctly. Such things could be:

- if the config is invalid e.g. has unknown options
- if there are incompatible configurations e.g. adapter static with cookies as detection strategy
- missing `%lang%` placeholder in template

## Structure

This repository will be included in the inlang monorepo and contain following sub packages:

- `runtime`: the core functionality of the SDK
- `adapter-sveltekit`: `SvelteKit` specific adapter
- `adapter-*`: other (meta-)framework specific adapter
- `detectors`: functions to detect languages depending on the strategy
- `config`: functions that deal with the inlang config
- `utils`: other shared utility functions that do not belong anywhere else

## Documentation, Guides & Examples

An important part of the SDK will also be the documentation. The basics should be pretty straight forward, but as soon as a developer needs something customized, he needs to be able to find it easily and well described.

On top of that we should create a few examples of how to use the SDK.

For things that are not part of the SDK, but probably needed in a lot of applications, we can write guides on how to set it up. e.g. providing a language menu does not make sense, since it probably needs to be slightly customized and styled independently.

> We could think of a renderless component that just provides the functionality but leaves the rendering to the user.

## implementation details (current state)

The SvelteKit adapter will be a bundler plugin that rewrites some files during the bundling process to enable the desired i18n functionality.

There are a couple of things that need to be considered when implementing the `SvelteKit` adapter (and probably others too). Where do we need to load what things? Is it done in an optimal way? Do we handle all edge cases?

As of my current knowledge, this is needed to implement i18n in a `SvelteKit` project the best possible way:

> The diff shows what is needed to be changed to support i18n. I didn't test the code so not everything might work 100% like this. But it should give you a first idea what we need to think of.

### `hooks.server.ts`

This is the entry point of a SvelteKit application. Each requests will start at the `handle` hook. This is the best place to load things into memory and attach certain objects to the request.

```diff
import type { Handle } from '@sveltejs/kit'
+import { loadAllResources, detectLanguage, createLookupFunctionForLanguage } from '$i18n'

// load ´Resources` of all languages into memory
+loadAllResources()

export const handle = (async ({ event, resolve }) => {
  // detect the language depending on some strategy
+ const language = detectLanguage(event)

  // initialize the lookup function for the selected language
+ const i18n = createLookupFunctionForLanguage(language)

  // attach the language information to the request
+ event.locals.language = language
  // attach the i18n function to the request
+ event.locals.i18n = i18n

- return resolve(event)
  // when the request was completed, replace the HTML lang attribute with the language
+ return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', language) })
}) satisfies Handle
```

### `app.html`

This is the entry point of the rendered HTML output. For SEO purposes we want to set the correct lang attribute.

```diff
<!DOCTYPE html>
-<html lag="en">
+<html lang="%lang%">
	<head>%sveltekit.head%</head>
	<body><div id="svelte">%sveltekit.body%</div></body>
</html>
```

### `routes/+layout.server.ts`

Here, we need to pass the language from the "server" part to the "shared" runtime code.

```diff
import type { LayoutLoad } from './$types'

-export const load = (() => {
+export const load = (({ locals }) => {
+ return { language: locals.language }
}) satisfies LayoutLoad
```

### `routes/+layout.ts`

The shared layout needs to make sure that the `Resource` of the current language is being loaded before the rendering process kicks in. We also need to pass the language to the `.svelte` layout file.

```diff
import type { LayoutLoad } from './$types'
+import { loadResourceAsync } from '$i18n'

-export const load = (() => {
+export const load = (async ({ data }) => {
+ await loadResourceAsync(data.language)
+ return { language: data.language }
}) satisfies LayoutLoad
```

### `routes/+layout.svelte`

In the root layout file we need to initialize the lookup function and add that information to Svelte's context in order to retrieve it inside other components.

```diff
<script lang="ts">
  import type { LayoutData } from './$types'
+ import { setContext } from 'svelte'
+ import { createLookupFunctionForLanguage } from '$i18n'

  export let data: LayoutData
+ const i18n = createLookupFunctionForLanguage(data.language)

+ setContext('i18n', { language: data.language, i18n })
</script>

<slot />
```

### `*.svelte`

We need to retrieve the lookup function from the context and then call it.

```diff
+<script lang="ts">
+ import { getContext } from 'svelte/store'

+ const { i18n } = getContext('i18n')
+</script>

-<h1>Welcome to Inlang, SvelteKit</h1>
+<h1>{i18n.welcome({ name: 'SvelteKit' })}</h1>
```

Those are the very basics. Just to render a single translation on to the screen. You need every single statement to render that string. Easy to miss something and in larger applications you will have a lot of different stuff in those functions so it is not that straightforward where to put those lines. _Hint: as early as possible._

On top of that there come some edge cases:

### `*.ts`

#### client

If we want to use translations within a TypeScript file, we also need to get the lookup function from the context.

```diff
+ import { getContext } from 'svelte/store'

const doSomething = (projects: string[]) => {
  // ...

- return `Added ${projects.length} projects`
+ const { i18n } = getContext('i18n')
+ return i18n.projects.added(projects.length)
}
```

As long as the function get's called from a Svelte file, the function is able to retrieve the context.

If something get's called in an other way (I'm not even sure if it can), retrieving the context might not work. Then we would need to write it like this:

```diff
+ import { getLookupFunctionForCurrentLanguage } from '$i18n'

const doSomething = (projects: string[]) => {
  // ...

- return `Added ${projects.length} projects`
+ const i18n = getLookupFunctionForCurrentLanguage()
+ return i18n.projects.added(projects.length)
}
```

The `loadResourceAsync` from `+layout.ts` and `createLookupFunctionForLanguage` from `+layout.svelte` will save the language and the lookup function into memory. When `getLookupFunctionForCurrentLanguage` gets called, it can take those information and return the already initialized lookup function.

> We might be able to just use a single variant, but we need to test this first. The second variant should work for both cases.

#### server

On the server everything is shared between multiple requests. This means we need to pass the lookup function to all functions that use them.

```diff
-const doSomething = (projects: string[]) => {
+const doSomething = (i18n, projects: string[]) => {
  // ...

- return `Added ${projects.length} projects`
+ return i18n.projects.added(projects.length)
}
```

This makes it more complicated because now we also need to look where this function get's called and update the function calls. Sometimes multiple levels deep.

I'm not really sure if it's worth the effort to do that in an automatic way. We could just say that we don't support that use case and developers need to pass the object around manually.

### `routes/[slug]/+layout*.ts` or `routes/[slug]/+page*.ts`

What if you want to output a `Message` in a `load` function? Since load functions run in parallel, we need to make sure that the `Resources` are already loaded.

#### `routes/[slug]/+layout.server.ts` or `routes/[slug]/+page.server.ts`

On the server we did that already inside the `hooks.server.ts` file. So we can use the lookup function we have set on the `locals` object.

```diff
import type { LayoutLoad } from './$types'

-export const load = (() => {
+export const load = (({ locals }) => {
- return { pageTitle: 'Home' }
+ return { pageTitle: locals.i18n.home.pageTitle() }
}) satisfies LayoutLoad
```

#### `routes/[slug]/+layout.ts` or `routes/[slug]/+page.ts`

The parallel processing of the `load` function makes this a bit more complicated on the shared code. We need to wait for the function from the `parent` `load` function to complete.

```diff
import type { LayoutLoad } from './$types'
+import { createLookupFunctionForLanguage } from '$i18n'

-export const load = (() => {
+export const load = (async ({ parent, data }) => {
+ await parent()
+ const i18n = createLookupFunctionForLanguage(data.language)
- return { pageTitle: 'Home' }
+ return { pageTitle: i18n.home.pageTitle() }
}) satisfies LayoutLoad
```

> Things could still be optimized, because the `parent` `load` could also do more async stuff than just loading `Resources`.

That's it. That should now cover everything that is needed to output strings in different languages.

## implementation details (with plugin)

Here are some examples how we will use the plugin approach to inject code at the right parts of those files.

> The diff shows what a developer would need to write and what the plugin would inject

### `hooks.server.ts`

```diff
import type { Handle } from '@sveltejs/kit'
+import { wrapHandle } from '$i18n'

-export const handle = (async ({ event, resolve }) => {
+export const handle = wrapHandle(async ({ event, resolve }) => {
  return resolve(event)
}) satisfies Handle
```

where `wrapHandle` could look like this:

```ts
export const wrapHandle = (callback) => async (args) => {
	const { event } = args

	loadAllResources()

	const language = detectLanguage(event)
	const i18n = createLookupFunctionForLanguage(language)

	event.locals.inlang = {
		language,
		i18n,
	}

	return callback(args)
}
```

### `routes/+layout.ts`

```diff
import type { LayoutLoad } from './$types'
+import { wrapLayoutJs } from '$i18n'

-export const load = (() => {
+export const load = wrapLayoutJs(() => {
}) satisfies LayoutLoad
```

where `wrapLayoutJs` could look like this:

```ts
export const wrapLayoutJs = (callback) => async (args) => {
	const { data } = await loadResourceAsync(data.inlangLanguage)

	const result = await callback(args)

	return { ...result, inlangLanguage: data.inlangLanguage }
}
```

### `routes/+layout.svelte`

```diff
+<script>
+ import { I18nWrapper } from '$i18n'
+</script>

-<slot />
+<I18nWrapper>
+ <slot />
+</I18nWrapper>
```

where the `I18nWrapper` component could look like this:

```svelte
<script>
  import { page } from '$app/stores'
  import { setContext } from 'svelte'
  import { createLookupFunctionForLanguage } from '$i18n'

  export let data: LayoutData
  const i18n = createLookupFunctionForLanguage($page.data.inlangLanguage)

  setContext('inlang', { language: data.language, i18n })
</script>

<slot />
```

### `*.svelte`

```diff
<script lang="ts">
- import i18n from '$i18n'
+ import { getContext } from 'svelte/store'

+ const { i18n } = getContext('inlang')
</script>

<h1>{i18n.welcome({ name: 'SvelteKit' })}</h1>
```

It you take a deeper look at the examples above, you will see that the only time a developer needs to import some i18n stuff is where he wants to call the lookup function. Everything else is being injected by the plugin.

**Taking DX to the next level!**

An adapter will also export those wrapper functions. If someone does not trust the plugin, they can use the wrapper functions instead. If an adapter sees a manual import, it will not inject any code to that file. Maybe we also need to think of an `/* disable-inlang-adapter */` comment so anyone is able to opt out for auto-injection in certain files or sections of the code.

Those wrapper functions will be written in pure `JavaScript` annotated with `JsDoc` so no transpilation is needed.

If some file is not present on the filesystem we need to do something similar to this: https://github.com/HoudiniGraphql/houdini/blob/961b062f395db2eab33a57053bc8314d330cf30d/packages/houdini-svelte/src/plugin/fsPatch.ts

### @sveltejs/adapter-static

Svelte also offers the option to prerender an application and generate a static output. A few options will not make sense (e.g. `AcceptLanguage` header detection) and we should detect them and output an error. We can detect a static output by looking for `export const prerender = false` in the `routes/+layout(.*).ts` file.

## Next steps

- [x] agree on RFC and scope of first version
- [ ] implement basic runtime functionality
- [ ] write wrapper functions/components for the necessary injection points
- [ ] create the plugin that automatically injects wrapper functions
- [ ] make it configurable
- [ ] add further functionality

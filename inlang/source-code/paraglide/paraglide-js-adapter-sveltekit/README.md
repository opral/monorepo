# Paraglide Adapter SvelteKit
> Not to be confused with SvelteKit's adapters.

Everything you need to internationalize your SvelteKit app with Paraglide.

**Features**
- Automatically set & manage the language for Paraglide
- Supports multiple i18n routing strategies
    - Url Prefix
    - Domain based
    - Search Param
- Automatically rewrite existing links to reflect your routing strategy
- Adds alternate language links to your pages, again based on your routing strategy
- Sets the `html` lang attribute for SEO

## Quickstart
There are four steps to setting up the Paraglide Adapter with SvelteKit.
1. Install the Vite Plugin
2. Adjust your `routes` if needed (very small change)
2. Add the Adapter Component to your Layout
4. Add the Server Hook.

We assume that you already have a SvelteKit app set up.

### 1. Install the Vite Plugin

```bash
npm i -D @inlang/paraglide-js-adapter-sveltekit
```

Then add the adapter to your `vite.config.js` file:

```js
import { paraglide } from '@inlang/paraglide-js-adapter-sveltekit'

export default defineConfig({
    plugins: [
        paraglide({
            project: "./project.inlang",
            outdir: "./src/paraglide",

            // default strategy is "prefix"
            routingStrategy: {
                name: "prefix"
            }
        }),
        sveltekit()
    ]
})
```

The vite plugin does a few things:
1. It replaces the `paraglide compile` commands in your `package.json`.
2. It adds the Link Preprocessor
3. It decides the routing Strategy your app uses.


### 2. Adjust your Routes
If you are using the Url Prefix strategy, you need to add a `lang` parameter to your routes. Otherwise SvelteKit can't match the routes. If you are using a different strategy, you can skip this step.

Move your routes from `src/routes` to `src/routes/[[lang]]`.

```diff
- src/routes/about.svelte
+ src/routes/[[lang]]/about.svelte
```

To only allow valid `lang`'s, create a param matcher in `src/params/lang.js` with the following content:

```js
import { isAvailableLanguageTag } from '$paraglide/runtime.js'
export const match = isAvailableLanguageTag();
```

and then use it on the `lang` param in your routes:

```diff
- src/routes/[[lang]]/about.svelte
+ src/routes/[[lang=lang]]/about.svelte
```

### 3. Add the Adapter Component
To set the language for Paraglide, you need to add the Adapter Component to your Layout. 

```svelte
<!-- src/routes/+layout.svelte -->
<script>
    import { ParaglideJS } from '@inlang/paraglide-js-adapter-sveltekit'
</script>

<ParaglideJS>
    <slot />
</ParaglideJS>
```

### 4. Add the Server Hook
The Server Hook set's the `<html lang>` attribute. This is very important for SEO. 

```js
import { setHtmlLang } from '@inlang/paraglide-js-adapter-sveltekit'
import { sequence } from "@sveltejs/kit/hooks"

export const handle = sequence([
    setHtmlLang("%lang%"), 
    // ... your other hooks
])
```



## Automatic Link Rewriting
The adapter will automatically register a Svelte preprocessor that rewrites all links in your app to reflect your routing strategy. For example, if you are using the Url Prefix strategy, the adapter would perform the following rewrites:

```diff
- <a href="/about">About</a>
+ <a href="/en/about">About</a>

- <a href={myLink}>About</a>
+ <a href={`/en/${myLink}`}>/en/about</a>
```

If you want a linkt to get translated into a specific language, you can set an `hreflang` attribute on it. The adapter will then use that language instead of the current one.

```diff
- <a href="/about" hreflang="de">About</a>
+ <a href="/de/about" hreflang="de">About</a>
```

The `hreflang` attribute must be a valid language. This works with both static and dynamic hreflang attributes. 


The idea behind the preprocessor is to minimise the changes you need to make to your app. You can it in multiple ways:

- Don't translate a specific link by adding the `data-no-translate` attribute
- Don't translate a link to a page or pages by matching them with the `exclude` option in the vite plugin
- Disable the preprocessor entirely with `disablePreprocessor: true` in the vite plugin

## Routing Strategies
The adapter supports three routing strategies:
- Url Prefix
- Domain
- Search Param

You can choose between them with the `routingStrategy` option in the vite plugin.

### Url Prefix
This is your standard i18n routing strategy. It prefixes the language code to the url path.

- `/` -> `/en`, `/de` etc.
- `/about` -> `/en/about`, `/de/about` etc.

The default language will _not_ have a prefix. You can change this by setting `prefixDefault` to `true`. In that case all languages will have a prefix & the un-prefixed url will no longer work.

```ts
// vite.config.js
paraglide({
    routingStrategy: {
        name: "prefix",
        prefixDefault: true // default: false
    }
})
```

### Domain Based 
This strategy uses a different domain for each language. You can use subdomains or top level domains.
You can configure the domains with the `domains` option in the vite plugin.

```ts
// vite.config.js
paraglide({
    routingStrategy: {
        name: "domain",
        domains: {
            //do not include the protocol or a trailing slash
            en: "example.com",
            de: "example.de",
            fr: "fr.example.com"
        }
    }
})
```

You must provide a unique domain for each language.


### Search Param
This strategy isn't recommended, since it's bad for SEO. It switches between languages by adding a search param to the url. 

- `/` -> `/?lang=en`, `/?lang=de` etc.
- `/about` -> `/about?lang=en`, `/about?lang=de` etc.

If no search param is present, the default language will be used.

```ts
// vite.config.js
paraglide({
    routingStrategy: {
        name: "searchParam",
        searchParamName: "lang" // default: "lang"
    }
})
```
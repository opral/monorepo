# Roadmap & Caveats

- Translated parameters
- Domain Based routing
- Fix the Caveats

# Caveats

1. Links in the same Layout Component as `<ParagldieJS>` will not be translated. This will also log a warning in development.
2. Messages are not reactive. Don't use them in server-side module scope.
3. Side effects triggered by `data` will run on language changes even if the data didn't change. If the data is language-dependent the side effect will run twice. 
4. The `languageTag` function cannot be used inside param matchers.

## Using messages in `+layout.svelte`

The language state gets set when the `<ParaglideJS>` component is mounted. Since you usually place it inside `+layout.svelte` using messages in the layout's `<script>` can cause issues.

```svelte
<script>
    import { ParaglideJS } from '@inlang/paraglide-sveltekit'
	import { i18n } from '$lib/i18n.js'

	//using messages here can cause hydration issues
</script>

<ParaglideJS {i18n}>
	<!-- Using messages here is fine -->
    <slot />
</ParaglideJS>
```

## Issues on Vercel

SvelteKit's `reroute` hook currently doens't play well with Vercel (see [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879)), which means that we need to slightly adapt the setup to make it work when deployed to Vercel.

1. Remove the `reroute` hook from `src/hooks.js`
2. Move the routes you want to localize `routes` into a `[[locale]]` folder
3. Don't use translated `pathnames`

We are working on contributing a fix for [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879), so this workaround will hopefully not be needed much longer.

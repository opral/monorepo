
## Getting Started

Get started instantly with the Paraglide-SvelteKit CLI.

```bash
npx @inlang/paraglide-sveltekit init
npm install
```

The CLI will ask you which languages you want to support. This can be changed later.

- Create an [Inlang Project](https://inlang.com/documentation/concept/project)
- Create translation files for each of your languages
- Add necessary Provider Components and files
- Update your `vite.config.js` file to use the Paraglide-SvelteKit Plugin.

You can now start your development server and visit `/de`, `/ar`, or whatever languages you've set up.

## Creating Messages

Your messages live in `messages/{languageTag}.json` files. You can add messages in these files as key-value pairs of the message ID and the translations.

Use curly braces to add parameters.

```json
// messages/en.json
{
	// The $schema key is automatically ignored
	"$schema": "https://inlang.com/schema/inlang-message-format",

	"hello_world": "Hello World!",
	"greetings": "Greetings {name}."
}
```

Learn more about the format in the [Inlang Message Format Documentation](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).

## Using messages in Code

You can use messages in code by importing them from `$lib/paraglide/messages.js`. By convention a wildcard import is used.

```svelte
<script>
	import * as m from '$lib/paraglide/messages.js'
</script>

<h1>{m.homepage_title()}</h1>
<p>{m.homepage_subtitle({ some: "param" })}</p>
```

Only messages used on the current page are sent to the client. Any messages that aren't used on the current page will be tree-shaken out.

## Caveats

1. Links in the same Layout Component as `<ParagldieJS>` will not be translated. This will also log a warning in development.
2. Messages are not reactive. Don't use them in server-side module scope.
3. Side effects triggered by `data` will run on language changes even if the data didn't change. If the data is language-dependent the side effect will run twice. 

### Using messages in `+layout.svelte`

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

### Issues on Vercel

SvelteKit's `reroute` hook currently doens't play well with Vercel (see [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879)), which means that we need to slightly adapt the setup to make it work when deployed to Vercel.

1. Remove the `reroute` hook from `src/hooks.js`
2. Move the routes you want to localize `routes` into a `[[locale]]` folder
3. Don't use translated `pathnames`

We are working on contributing a fix for [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879), so this workaround will hopefully not be needed much longer.

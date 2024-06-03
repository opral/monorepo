
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

You can use messages in code by importing them from `$lib/paraglide/messages.js`. By convention, a wildcard import is used.

```svelte
<script>
	import * as m from '$lib/paraglide/messages.js'
</script>

<h1>{m.homepage_title()}</h1>
<p>{m.homepage_subtitle({ some: "param" })}</p>
```

Only messages used on the current page are sent to the client. Any messages that aren't used on the current page will be tree-shaken out.

## Switching Languages

The language is determined based on the URL. If the first segment of the URL is a language tag, that language will be used. If no language tag is present, the default language will be used.

- `/about` - English
- `/de/about` - German

There is no need to add a `[locale]` route parameter for this, the `reroute` hook already reroutes paths with languages to the correct pages.
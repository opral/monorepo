# Framework Libraries

Paraglide itself is framework agnostic, but there are framework-specific libraries available. If there is one for your framework you will want to follow its documentation. 

<doc-links>
	<doc-link title="Paraglide-Next" icon="tabler:brand-nextjs" href="/m/osslbuzt/paraglide-next-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-SvelteKit" icon="simple-icons:svelte" href="/m/dxnzrydw/paraglide-sveltekit-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-Astro" icon="devicon-plain:astro" href="/m/iljlwzfs/paraglide-astro-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-SolidStart" icon="tabler:brand-solidjs" href="/m/n860p17j/paraglide-solidstart-i18n" description="Go to Library"></doc-link>
	<doc-link title="Paraglide-Remix" icon="simple-icons:remix" href="/m/fnhuwzrx/paraglide-remix-i18n" description="Go to Library"></doc-link>
	<doc-link title="Or write your own" icon="ph:sparkle-fill" href="#writing-a-framework-library" description="Learn How"></doc-link>
</doc-links>

## Writing a Framework Library

You can of course write your own framework library if there isn't one for your framework.

Paraglide-Framework-Library integrates with a framework's lifecycle. It does two things:

1. Calls `setLanguageTag()` at appropriate times to set the language
2. Reacts to `onSetLanguageTag()`, usually by navigating or relading the page.

Additionally, it may provide convenience features such as localised routing.

Many popular frameworks already have libraries available, check out the [list of available framework libraries](#use-it-with-your-favorite-framework).

If there isn't one for your framework, you can write your own. This example adapts Paraglide to a fictitious full-stack framework.

```tsx
import {
	setLanguageTag,
	onSetLanguageTag,
	type AvailableLanguageTag,
} from "../paraglide/runtime.js"
import { isServer, isClient, request, render } from "@example/framework"
import { detectLanguage } from "./utils.js"

if (isServer) {
	// On the server the language tag needs to be resolved on a per-request basis.
	// Pass a getter function that resolves the language from the correct request

	const detectLanguage = (request: Request): AvailableLanguageTag => {
		//your logic ...
	}
	setLanguageTag(() => detectLanguage(request))
}

if (isClient) {
	// On the client, the language tag can be resolved from
	// the document's html lang tag.
	setLanguageTag(() => document.documentElement.lang)

	// When the language changes we want to re-render the page in the new language
	// Here we just navigate to the new route

	// Make sure to call `onSetLanguageTag` after `setLanguageTag` to avoid an infinite loop.
	onSetLanguageTag((newLanguageTag) => {
		window.location.pathname = `/${newLanguageTag}${window.location.pathname}`
	})
}

// Render the app once the setup is done
render((page) => (
	<html lang={request.languageTag}>
		<body>{page}</body>
	</html>
))
```

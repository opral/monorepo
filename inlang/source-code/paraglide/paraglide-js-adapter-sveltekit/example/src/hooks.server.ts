import type { AvailableLanguageTag } from "$paraglide/runtime"
import { getLanguage } from "$paraglide-adapter-sveltekit"

/*
	We set the `lang` and `dir` attributes on the `<html>` element using a hook.
	the `app.html` file contains placeholders for these attributes, which we just find and replace.
*/

export async function handle({ event, resolve }) {
	const lang: AvailableLanguageTag = getLanguage(event.url)

	return await resolve(event, {
		transformPageChunk({ done, html }) {
			if (done) {
				return html.replace("%lang%", lang)
			}
		},
	})
}

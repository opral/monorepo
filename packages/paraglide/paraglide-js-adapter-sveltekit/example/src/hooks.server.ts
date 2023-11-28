import { getTextDirection } from "$lib/i18n"
import { sourceLanguageTag, type AvailableLanguageTag } from "$paraglide/runtime"

/*
	This whole file could be made redundant if svelte
	introduces a `<svelte:html>` tag that allows us to
	do this in the template.

	`+layout.svelte` does the same thing on the client side.
*/


export async function handle({ event, resolve }) {
	const lang: AvailableLanguageTag =
		(event.params.lang as AvailableLanguageTag) ?? sourceLanguageTag
	const textDirection = getTextDirection(lang)


	return await resolve(event, {
		transformPageChunk({ done, html }) {
			if (done) {
				return html.replace("%lang%", lang).replace("%textDir%", textDirection)
			}
		},
	})
}

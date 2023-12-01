import { getTextDirection } from "$lib/i18n"
import { sourceLanguageTag, type AvailableLanguageTag } from "$paraglide/runtime"

/*
	We set the `lang` and `dir` attributes on the `<html>` element using a hook.
	the `app.html` file contains placeholders for these attributes, which we just find and replace.
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

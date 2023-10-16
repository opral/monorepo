import { sourceLanguageTag } from "@inlang/paraglide-js/sveltekit-example/runtime"
import type { Handle } from "@sveltejs/kit"
import { redirect } from "@sveltejs/kit"

export const handle: Handle = async ({ event, resolve }) => {
	if (event.params.lang === undefined) {
		throw redirect(301, `${sourceLanguageTag}/${event.url.href}`)
	}
	const response = await resolve(event)
	return response
}

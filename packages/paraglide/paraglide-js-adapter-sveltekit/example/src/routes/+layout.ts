import { sourceLanguageTag } from "$paraglide/runtime.js"

export const prerender = true

export async function load({ params }) {
	const lang = params.lang ?? sourceLanguageTag
	return { lang }
}

import { sourceLanguageTag } from "$paraglide/runtime.js"

// You don't have to prerender
export const prerender = true

export async function load({ params }) {
	//Figure out which language to use
	//If the parameter isn't there, use the source language

	const lang = params.lang ?? sourceLanguageTag
	return { lang }
}

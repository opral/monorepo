import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types.js"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"
import { initState } from "@inlang/sdk-js/adapter-sveltekit/server"

export const prerender = true

export const GET = (({ params: { languageTag } }) =>
	// eslint-disable-next-line unicorn/no-null
	json(getResource(languageTag) || null)) satisfies RequestHandler

export const entries = async () => {
	const { languageTags } = await initState(await import("../../../../inlang.config.js"))

	return languageTags.map((languageTag) => ({ languageTag: `${languageTag}.json` }))
}

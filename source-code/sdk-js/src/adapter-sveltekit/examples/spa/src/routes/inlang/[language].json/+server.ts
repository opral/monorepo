import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types.js"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = (({ params: { languageTag } }) =>
	// eslint-disable-next-line unicorn/no-null
	json(getResource(languageTag) || null)) satisfies RequestHandler

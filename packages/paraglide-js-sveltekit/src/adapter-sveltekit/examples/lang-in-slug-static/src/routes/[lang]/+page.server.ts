import { initState } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"
import { initServerLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<PageServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/+page.server.ts", i("welcome"))
})

export const entries = async () => {
	const { languageTags } = await initState()

	return languageTags.map((languageTag) => ({ lang: languageTag }))
}

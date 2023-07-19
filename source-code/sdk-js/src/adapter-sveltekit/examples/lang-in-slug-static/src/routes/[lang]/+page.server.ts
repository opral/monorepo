import { initState } from "@inlang/sdk-js/adapter-sveltekit/server"
import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<PageServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/+page.server.ts", i("welcome"))
})

export const entries = async () => {
	const { languageTags } = await initState(await import("../../../inlang.config.js"))

	return languageTags.map((languageTag) => ({ lang: languageTag }))
}

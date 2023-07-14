import { initState } from "@inlang/sdk-js/adapter-sveltekit/server"
import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<PageServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/+page.server.ts", i("welcome"))
})

export const entries = async () => {
	const { languages } = await initState(await import("../../../inlang.config.js"))

	return languages.map((language) => ({ lang: language }))
}

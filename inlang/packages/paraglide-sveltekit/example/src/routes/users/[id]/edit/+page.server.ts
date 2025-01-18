import { languageTag } from "$lib/paraglide/runtime"
import type { Actions } from "./$types"

export const prerender = false

export const actions: Actions = {
	create: async () => {
		console.info("create", languageTag())
	},
}

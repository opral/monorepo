import type { Actions } from "./$types"

export const prerender = false

export const actions: Actions = {
	create: async ({ locals }) => {
		console.info("create", locals.paraglide.lang)
	},
}

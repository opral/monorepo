import { redirect } from "@sveltejs/kit"

export const prerender = false

export const actions = {
	redirect: async () => {
		redirect(303, "/?redirected=true")
	},
}

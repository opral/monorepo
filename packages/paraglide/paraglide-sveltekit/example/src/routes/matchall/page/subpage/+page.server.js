import { getLocalStorage } from "$lib/storage.js"

export const actions = {
	do_something: async () => {
		const lang = getLocalStorage()
		console.info("action ran with", lang)
	},
}

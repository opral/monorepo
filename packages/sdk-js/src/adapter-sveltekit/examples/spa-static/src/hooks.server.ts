import type { Handle } from "@sveltejs/kit"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	return resolve(event)
}) satisfies Handle

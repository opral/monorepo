import type { LayoutServerLoad } from "./$types.js"

export const prerender = true

export const load = (async ({ locals }) => {
	console.info("[lang]/+layout.server.ts", locals.i18n.i("welcome"))
}) satisfies LayoutServerLoad

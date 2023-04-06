import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	console.info("[lang]/about/+layout.server.ts", locals.i18n.i("welcome"))
}) satisfies LayoutServerLoad

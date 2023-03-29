import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	console.log("/+layout.server.ts", locals.i18n.i("welcome"))

	return { language: locals.i18n.language }
}) satisfies LayoutServerLoad

import type { PageServerLoad } from "./$types.js.js"

export const load = (async ({ locals }) => {
	console.info("about/+page.server.ts", locals.i18n.i("welcome"))
}) satisfies PageServerLoad

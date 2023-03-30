import type { LayoutServerLoad } from "./$types.js"

export const prerender = true

export const load = (async ({ locals, url }) => {
	// console.info("+layout.server.ts", locals.i18n.i("welcome"))

	url.pathname // just to trigger invalidation on url change

	return { language: locals.i18n.language }
}) satisfies LayoutServerLoad

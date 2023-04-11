import { browser } from "$app/environment"
import { initI18nRuntime, inlangSymbol } from "../inlang.js"
import type { LayoutLoad } from "./$types.js"

export const prerender = true

export const load = (async ({ fetch, data }) => {
	let language: string | undefined = undefined

	if (browser) {
		// Note: SPA (non-static) could also detect the language on the server
		language =
			(browser
				? localStorage.getItem("inlang-language") // TODO: detect language
				: undefined) || data.referenceLanguage
	}

	browser && localStorage.setItem("inlang-language", language as string)

	const runtime = await initI18nRuntime({
		fetch,
		language: language as string,
		referenceLanguage: data.referenceLanguage,
		languages: data.languages,
	})

	if (browser) {
		const i = runtime.getInlangFunction()

		console.info("+layout.ts", i("welcome"))
	}

	return { ...(data || {}), "+layout.ts": Math.random(), [inlangSymbol]: runtime }
}) satisfies LayoutLoad

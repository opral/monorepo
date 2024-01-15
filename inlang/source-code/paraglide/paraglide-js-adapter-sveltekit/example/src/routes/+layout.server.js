import { i18n } from "$lib/i18n.js"

export const prerender = true

export function load({ url }) {
	const lang = i18n.getLanguageFromUrl(url)
	return { lang }
}

import { isAvailableLanguageTag, sourceLanguageTag } from "$paraglide/runtime"
import { getCanonicalPath } from "@inlang/paraglide-js-adapter-sveltekit"

const translations = {
	"/about": {
		en: "/about",
		de: "/ueber-uns",
		fr: "/a-propos",
	},
	"/some-subpage": {
		en: "/some-subpage",
		de: "/irgendeine-unterseite",
		fr: "/quelque-sous-page",
	},
}

/** @param {string} path */
function getLanguageFromPath(path) {
	const maybeLang = path.split("/").filter(Boolean).at(0)
	if (isAvailableLanguageTag(maybeLang)) {
		return maybeLang
	}
	return sourceLanguageTag
}

/** @param {string} path */
function getPahtWihtoutLanguage(path) {
	const maybeLang = path.split("/").filter(Boolean).at(0)
	if (isAvailableLanguageTag(maybeLang)) {
		return path.replace(`/${maybeLang}`, "")
	}
	return path
}

/** @type {import("@sveltejs/kit").Reroute} */
export const reroute = ({ url }) => {
	const lang = getLanguageFromPath(url.pathname)
	const pathname = getPahtWihtoutLanguage(url.pathname)
	return getCanonicalPath(pathname, lang, translations)
}

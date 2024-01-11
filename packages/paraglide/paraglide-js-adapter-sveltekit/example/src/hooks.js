import { getCanonicalPath } from "@inlang/paraglide-js-adapter-sveltekit"

const translations = {
	"/about": {
		en: "/about",
		de: "/ueber-uns",
		fr: "/a-propos",
	},
	"/admin": {
		en: "/admin",
		de: "/admin",
		fr: "/admin",
	},
	"/admin/users": {
		en: "/admin/users",
		de: "/admin/benutzer",
		fr: "/admin/utilisateurs",
	},
	"/admin/users/[id]": {
		en: "/admin/users/[id]",
		de: "/admin/benutzer/[id]",
		fr: "/admin/utilisateurs/[id]",
	},
	"/some-subpage": {
		en: "/some-subpage",
		de: "/irgendeine-unterseite",
		fr: "/quelque-sous-page",
	},
}

/** @type {import("@sveltejs/kit").Reroute} */
export const reroute = ({ url }) => {
	return getCanonicalPath(url.pathname, translations)
}

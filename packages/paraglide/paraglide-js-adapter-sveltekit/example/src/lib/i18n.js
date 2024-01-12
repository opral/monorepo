import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	"/about": {
		en: "/about",
		de: "/ueber-uns",
		fr: "/a-propos",
	},
	"/users": {
		en: "/users",
		de: "/benutzer",
		fr: "/utilisateurs",
	},
	"/users/[id]": {
		en: "/users/[id]",
		de: "/benutzer/[id]",
		fr: "/utilisateurs/[id]",
	},
	"/some-subpage": {
		en: "/some-subpage",
		de: "/irgendeine-unterseite",
		fr: "/quelque-sous-page",
	},
})

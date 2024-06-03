import { createI18n } from "@inlang/paraglide-sveltekit"
import { match as int } from "../params/int"
import * as runtime from "$lib/paraglide/runtime.js"
import * as m from "$lib/paraglide/messages.js"

export const i18n = createI18n(runtime, {
	pathnames: {
		"/about": m.about_path,
		"/users": {
			en: "/users",
			de: "/benutzer",
		},
		"/users/[id=int]/[...rest]": {
			en: "/users/[id=int]/[...rest]",
			de: "/benutzer/[id=int]/[...rest]",
		},
	},
	matchers: { int },
	prefixDefaultLanguage: "always",
	exclude: ["/base/not-translated"],
	textDirection: {
		en: "ltr",
		de: "ltr",
	},
})

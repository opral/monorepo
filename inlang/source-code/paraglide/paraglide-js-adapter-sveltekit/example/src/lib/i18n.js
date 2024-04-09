import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import { match as int } from "../params/int"
import * as runtime from "$paraglide/runtime.js"
import * as m from "$paraglide/messages.js"

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
	exclude: ["/base/not-translated"],
	textDirection: {
		en: "ltr",
		de: "ltr",
	},
})

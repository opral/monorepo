import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"
import * as m from "$paraglide/messages.js"
import { match as int } from "../params/int"

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
		"/some-subpage": {
			en: "/some-subpage",
			de: "/irgendeine-unterseite",
		},
		"/matchall/[...rest]": {
			en: "/matchall/[...rest]",
			de: "/joker/[...rest]",
		},
	},
	matchers: { int },
	exclude: ["/base/not-translated"],
	textDirection: {
		en: "ltr",
		de: "ltr",
	},
})

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
		"/users/[id=int]": {
			en: "/users/[id=int]",
			de: "/benutzer/[id=int]",
		},
		"/users/[id=int]/edit": {
			en: "/users/[id=int]/edit",
			de: "/benutzer/[id=int]/bearbeiten",
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

import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"
import * as m from "$paraglide/messages.js"

export const i18n = createI18n(runtime, {
	pathnames: {
		"/about": m.about_path,
		"/users": {
			en: "/users",
			de: "/benutzer",
			fr: "/utilisateurs",
			ru: "/пользователи",
		},
		"/users/[id]": {
			en: "/users/[id]",
			de: "/benutzer/[id]",
			fr: "/utilisateurs/[id]",
			ru: "/пользователи/[id]",
		},
		"/users/[id]/edit": {
			en: "/users/[id]/edit",
			de: "/benutzer/[id]/bearbeiten",
			fr: "/utilisateurs/[id]/modifier",
			ru: "/пользователи/[id]/редактировать",
		},
		"/some-subpage": {
			en: "/some-subpage",
			de: "/irgendeine-unterseite",
			fr: "/quelque-sous-page",
			ru: "/какая-то-подстраница",
		},
	},
	seo: {
		//noAlternateLinks: false,
	},
	exclude: ["/base/not-translated"],
	textDirection: {
		en: "ltr",
		de: "ltr",
		fr: "ltr",
		ru: "ltr",
	},
})

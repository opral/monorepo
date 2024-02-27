import { AvailableLanguageTag } from "@/paraglide/runtime"
import { createI18n } from "@inlang/paraglide-js-adapter-next"
import * as m from "@/paraglide/messages"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>({
		exclude: ["/not-translated"],
		pathnames: {
			"/about": m.about_path,
			"/form": {
				en: "/form",
				de: "/formular",
				"de-CH": "/formular",
			},
		},
	})

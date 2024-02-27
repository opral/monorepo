import { AvailableLanguageTag } from "@/paraglide/runtime"
import { createI18n } from "@inlang/paraglide-js-adapter-next"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>({
		exclude: ["/not-translated"],
		pathnames: {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
				"de-CH": "/ueber-uns",
			},
			"/form": {
				en: "/form",
				de: "/formular",
				"de-CH": "/formular",
			},
		},
	})

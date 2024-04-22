import {
	createI18n,
	createMiddleware,
	PrefixStrategy,
	createNavigation,
} from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages"
import * as runtime from "@/paraglide/runtime"

const strategy = PrefixStrategy({
	exclude: () => false,
	pathnames: {
		"/about": m.about_path,
		"/admin/[...rest]": {
			en: "/admin/[...rest]",
			de: "/administrator/[...rest]",
			"de-CH": "/administrator/[...rest]",
		},
	},
	availableLanguageTags: runtime.availableLanguageTags,
	defaultLanguage: runtime.sourceLanguageTag,
	prefix: "except-default",
})

export const middleware = createMiddleware({ strategy })
export const Nav = createNavigation({ strategy })

export const { Link, useRouter, usePathname, redirect, permanentRedirect, localizePath } =
	createI18n<AvailableLanguageTag>({
		pathnames: {
			"/about": m.about_path,
			"/admin/[...rest]": {
				en: "/admin/[...rest]",
				de: "/administrator/[...rest]",
				"de-CH": "/administrator/[...rest]",
			},
		},
		exclude: ["/not-translated"], //makes sure that the /not-translated page is not translated
	})

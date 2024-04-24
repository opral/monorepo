import {
	createI18n,
	createMiddleware,
	PrefixStrategy,
	createNavigation,
} from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages"

const strategy = PrefixStrategy<AvailableLanguageTag>({
	pathnames: {
		"/about": m.about_path,
		"/admin/[...rest]": {
			en: "/admin/[...rest]",
			de: "/administrator/[...rest]",
			"de-CH": "/administrator/[...rest]",
		},
	},
	prefix: "except-default",
	exclude: () => false,
})

export const middleware = createMiddleware({ strategy })
export const { Link, useRouter, usePathname, redirect, permanentRedirect } = createNavigation({
	strategy,
})

export const { localizePath } = createI18n<AvailableLanguageTag>({
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

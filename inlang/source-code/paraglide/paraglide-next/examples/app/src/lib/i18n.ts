import { createMiddleware, PrefixStrategy, createNavigation } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages"

export const routingStrategy = PrefixStrategy<AvailableLanguageTag>({
	pathnames: {
		"/about": m.about_path,
		"/admin/[...rest]": {
			en: "/admin/[...rest]",
			de: "/administrator/[...rest]",
			"de-CH": "/administrator/[...rest]",
		},
	},
	prefixDefault: "never",
	exclude: () => false,
})

export const middleware = createMiddleware({ strategy: routingStrategy })
export const { Link, useRouter, usePathname, redirect, permanentRedirect } = createNavigation({
	strategy: routingStrategy,
})

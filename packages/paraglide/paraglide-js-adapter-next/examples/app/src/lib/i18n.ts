import { AvailableLanguageTag } from "@/paraglide/runtime"
import { createI18n } from "@inlang/paraglide-js-adapter-next"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>({
		exclude: ["/not-translated"],
	})

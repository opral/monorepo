import { AvailableLanguageTag } from "@/paraglide/runtime"
import { createI18n } from "@inlang/paraglide-js-adapter-next"
import * as m from "@/paraglide/messages"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>({
		pathnames: {
			"/about": m.about_path,
		},

		exclude: ["/not-translated"], //makes sure that the /not-translated page is not translated
	})

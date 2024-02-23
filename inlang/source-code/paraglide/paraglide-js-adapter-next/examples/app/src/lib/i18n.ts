import { createI18n } from "@inlang/paraglide-js-adapter-next"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect } = createI18n(
	{
		exclude: ["/not-translated"],
	}
)

import { Navigation, Middleware, PrefixStrategy } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"

export const strategy = PrefixStrategy<AvailableLanguageTag>({
	prefixDefault: "always",
	exclude: () => false,
})

export const middleware = Middleware({ strategy })
export const { Link, useRouter, usePathname, redirect, permanentRedirect } = Navigation({
	strategy,
})

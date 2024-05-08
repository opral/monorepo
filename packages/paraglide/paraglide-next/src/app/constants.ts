import type { CookieConfig } from "./utils/cookie"

export const LINK_HEADER_NAME = "Link"
export const PARAGLIDE_LANGUAGE_HEADER_NAME = "x-language-tag"
export const ACCEPT_LANGUAGE_HEADER_NAME = "accept-language"

// settings for the native language cookie in the pages router
// someone on discord suggested we use these, which seems reasonable
export const LANG_COOKIE = {
	name: "NEXT_LOCALE",
	"Max-Age": 31557600, //Math.round(60 * 60 * 24 * 365.25) - 1 year,
	SameSite: "lax",
} as const satisfies Omit<CookieConfig, "value">

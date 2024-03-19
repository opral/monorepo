import { CookieConfig } from "./utils/cookie"

export const HeaderNames = {
	Link: "Link",
	ParaglideLanguage: "x-language-tag",
	AcceptLanguage: "accept-language",
} as const

// settings for the native language cookie in the pages router
// someone on discord suggested we use these, which seems reasonable
export const LANG_COOKIE = {
	name: "NEXT_LOCALE",
	maxAge: 31557600, //Math.round(60 * 60 * 24 * 365.25) - 1 year,
	sameSite: "lax",
} as const satisfies Omit<CookieConfig, "value">

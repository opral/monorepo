export type CookieConfig = {
	name: string
	value: string
	maxAge?: number
	path?: string
	httpOnly?: boolean
	sameSite?: "strict" | "lax" | "none"
}

export function serializeCookie(cookieConfig: CookieConfig) {
	const parts = []
	parts.push(`${cookieConfig.name}=${cookieConfig.value}`)
	if (cookieConfig.maxAge) {
		parts.push(`Max-Age=${cookieConfig.maxAge}`)
	}
	if (cookieConfig.httpOnly) {
		parts.push("HttpOnly")
	}
	if (cookieConfig.path) {
		parts.push(`Path=${cookieConfig.path}`)
	}
	if (cookieConfig.sameSite) {
		parts.push(`SameSite=${cookieConfig.sameSite}`)
	}
	return parts.join("; ")
}

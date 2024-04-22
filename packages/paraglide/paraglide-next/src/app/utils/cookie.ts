export type CookieConfig = {
	name: string
	value: string
	"Max-Age"?: number
	Path?: string
	HttpOnly?: boolean
	SameSite?: "strict" | "lax" | "none"
}

export function serializeCookie(cookieConfig: CookieConfig) {
	const parts = [`${cookieConfig.name}=${cookieConfig.value}`]

	for (const [key, value] of Object.entries(cookieConfig)) {
		if (key != "value" && key != "name")
			typeof value == "boolean" ? parts.push(`${key}`) : parts.push(`${key}=${value}`)
	}

	return parts.join("; ")
}

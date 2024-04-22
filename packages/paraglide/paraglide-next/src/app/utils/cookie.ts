export type CookieConfig = {
	name: string
	value: string
	"Max-Age"?: number
	Path?: string
	/**
	 * Leave property out if the cookie is not HTTP only
	 */
	HttpOnly?: true
	SameSite?: "strict" | "lax" | "none"
}

export function serializeCookie({ name, value, ...rest }: CookieConfig) {
	const parts = [`${name}=${value}`]

	for (const [key, value] of Object.entries(rest)) {
		parts.push(value === true ? key : `${key}=${value}`)
	}

	return parts.join("; ")
}

/**
 * An object representing a cookie
 *
 * For Boolean properties we use `true`/`undefined` instead of `true`/`false`
 */
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

/**
 * Returns a cookie string from a cookie config
 */
export const serializeCookie = ({ name, value, ...rest }: CookieConfig) =>
	name +
	"=" +
	value +
	";" +
	Object.entries(rest)
		.map(([key, value]) => (value === true ? key : key + "=" + value))
		.join(";")

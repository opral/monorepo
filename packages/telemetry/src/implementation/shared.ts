/**
 * The path to which API calls are made.
 */
export const ROUTE_PATH = "/shared/_tm"

/**
 * Fallback proxy if an env variable is missing.
 */
export const fallbackProxy = new Proxy(
	{},
	{
		get: function (target, prop) {
			if (typeof (target as any)[prop] === "undefined") {
				return () => undefined
			} else {
				return (target as any)[prop]
			}
		},
	},
)

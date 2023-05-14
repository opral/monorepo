import type { Plugin } from "./types.js"

/**
 * Wraps a plugin with error handling
 *
 * ! NOT WORKING RIGHT NOW SEE https://github.com/inlang/inlang/issues/604
 *
 * Increases DX and debuggability by providing better error messages
 * depending on the plugin that caused the error.
 */
export function withErrorHandling<T extends object>(pluginId: Plugin["id"], obj: T): T {
	return new Proxy(obj, {
		get(target, prop) {
			// Get the property from the original object
			const propValue = target[prop as keyof typeof target]

			if (typeof propValue === "object") {
				return withErrorHandling(pluginId, propValue as object)
			} else if (typeof propValue !== "function") {
				return propValue
			}

			return (...args: any[]) => {
				try {
					const returnValue = (propValue as any).apply(this, args)
					if (typeof returnValue === "object") {
						return withErrorHandling(pluginId, returnValue)
					} else if (typeof returnValue === "function") {
						return (...args: any[]) => {
							try {
								returnValue.apply(this, args)
							} catch (error) {
								logErrorMessage(pluginId, prop as string, error)
								throw error
							}
						}
					}
					return returnValue
				} catch (error) {
					logErrorMessage(pluginId, prop as string, error)
					throw error
				}
			}
		},
	})
}

function logErrorMessage(pluginId: Plugin["id"], prop: string, error: unknown) {
	console.error(
		`Error in plugin '${pluginId}': Function '${String(prop)}' returned '${
			(error as Error)?.message
		}'`,
	)
}

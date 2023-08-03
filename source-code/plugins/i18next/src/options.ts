// pluginOptions for i18next plugin
export type PluginOptions = {
	pathPattern: string | Record<string, string>
	variableReferencePattern?: string[] //default is ["{{", "}}"]
	ignore?: string[]
}

/**
 * Throws an error if the options are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidOptions(options: PluginOptions) {
	if (typeof options.pathPattern === "string") {
		if (options.pathPattern.includes("{languageTag}") === false) {
			throw new Error(
				"The pathPattern setting must be defined and include the {languageTag} expression. An example would be './resources/{languageTag}.json'.",
			)
		} else if (options.pathPattern.endsWith(".json") === false) {
			throw new Error(
				"The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'.",
			)
		} else if (options.pathPattern.includes("*")) {
			throw new Error(
				"The pathPattern includes a '*' wildcard. This was depricated in version 3.0.0. Check https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next/ for how to use PluginOptions",
			)
		}
	} else {
		for (const [prefix, path] of Object.entries(options.pathPattern)) {
			if (path === undefined || path.includes("{languageTag}") === false) {
				throw new Error(
					"The pathPattern setting must be defined and include the {languageTag} expression. An example would be './resources/{languageTag}.json'.",
				)
			} else if (path.endsWith(".json") === false) {
				throw new Error(
					"The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'.",
				)
			} else if (prefix.includes(".")) {
				throw new Error(
					"A prefix of pathPattern includes an '.'. Use a string without dot notations. An example would be 'common'.",
				)
			}
		}
	}
}

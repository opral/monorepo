/**
 * Throws an error if the settings are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidSettings(settings: PluginSettings) {
	if (typeof settings.pathPattern === "string") {
		if (settings.pathPattern.includes("{language}") === false) {
			throw new Error(
				"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
			)
		} else if (settings.pathPattern.endsWith(".json") === false) {
			throw new Error(
				"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
			)
		} else if (settings.pathPattern.includes("*")) {
			throw new Error(
				"The pathPattern includes a '*' wildcard. This was depricated in version 3.0.0. Check https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next/ for how to use PluginSettings",
			)
		}
	} else {
		for (const [prefix, path] of Object.entries(settings.pathPattern)) {
			if (path === undefined || path.includes("{language}") === false) {
				throw new Error(
					"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
				)
			} else if (path.endsWith(".json") === false) {
				throw new Error(
					"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
				)
			} else if (prefix.includes(".")) {
				throw new Error(
					"A prefix of pathPattern includes an '.'. Use a string without dot notations. An example would be 'common'.",
				)
			}
		}
	}
}

export type PluginSettings = {
	/**
	 * Defines the path pattern for the resources.
	 *
	 * Could be one path or multible namespaces
	 * Must include the `{language}` placeholder.
	 *
	 * @example
	 *  "./resources/{language}.json"
	 *
	 * @example
	 *  {
	 * 		"common": "./resources/{language}/common.json"
	 * 		"card": "./resources/{language}/card.json"
	 *  }
	 */
	pathPattern: string | { [key: string]: string }
	/**
	 * Defines the pattern for variable references.
	 *
	 * Can be either a single string ("Hello @user") or
	 * an array of two strings ("Hello {{user}}").
	 */
	variableReferencePattern?: [string] | [string, string]
	/**
	 * Ignores all files that match the given pattern.
	 */
	ignore?: string[]
}

export type PluginSettingsWithDefaults = WithRequired<
	PluginSettings,
	"variableReferencePattern" | "ignore"
>

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

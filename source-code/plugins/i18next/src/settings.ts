/**
 * Throws an error if the settings are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidSettings(settings: PluginSettings) {
	if (settings.pathPattern === undefined || settings.pathPattern.includes("{language}") === false) {
		throw new Error(
			"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
		)
	} else if (settings.pathPattern.endsWith(".json") === false) {
		throw new Error(
			"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
		)
	}
}

export type PluginSettings = {
	/**
	 * Defines the path pattern for the resources.
	 *
	 * Must include the `{language}` placeholder.
	 *
	 * @example
	 *  "./resources/{language}.json"
	 */
	pathPattern: string
	/**
	 * Defines the pattern for variable references.
	 *
	 * Can be either a single string ("Hello @user") or
	 * an array of two strings ("Hello {{user}}").
	 */
	variableReferencePattern?: [string] | [string, string]
	ignore?: string[]
}

export type PluginSettingsWithDefaults = WithRequired<
	PluginSettings,
	"variableReferencePattern" | "ignore"
>

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// Settings for i18next plugin
export type PluginSettings = {
	pathPattern: string | Record<string, string>
	variableReferencePattern?: string[] //default is ["{{", "}}"]
	sourceLanguageFilePath?: string | Record<string, string>
	ignore?: string[]
}

/**
 * Throws an error if the settings are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidSettings(settings: PluginSettings) {
	if (typeof settings.pathPattern === "string") {
		if (settings.pathPattern.includes("{languageTag}") === false) {
			throw new Error(
				"The pathPattern setting must be defined and include the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
			)
		} else if (settings.pathPattern.includes("{{languageTag}}") === true) {
			throw new Error(
				"The pathPattern setting must use single brackets instead of double brackets for the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
			)
		} else if (settings.pathPattern.endsWith(".json") === false) {
			throw new Error(
				"The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'."
			)
		} else if (settings.pathPattern.includes("*")) {
			throw new Error(
				"The pathPattern includes a '*' wildcard. This was depricated in version 3.0.0. Check https://inlang.com/marketplace/plugin.inlang.i18next for how to use Pluginsettings"
			)
		}
	} else {
		for (const [prefix, path] of Object.entries(settings.pathPattern)) {
			if (path === undefined || path.includes("{languageTag}") === false) {
				throw new Error(
					"The pathPattern setting must be defined and include the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
				)
			} else if (path === undefined || path.includes("{{languageTag}}") === true) {
				throw new Error(
					"The pathPattern setting must use single brackets instead of double brackets for the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
				)
			} else if (path.endsWith(".json") === false) {
				throw new Error(
					"The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'."
				)
			} else if (prefix.includes(".")) {
				throw new Error(
					"A prefix of pathPattern includes an '.'. Use a string without dot notations. An example would be 'common'."
				)
			}
		}
	}
	if (settings.sourceLanguageFilePath) {
		if (typeof settings.pathPattern !== typeof settings.sourceLanguageFilePath) {
			throw new Error(
				"The sourceLanguageFilePath setting must have the same structure as the pathPattern setting. Either both are strings or both have the object structure of namespaces."
			)
		} else if (
			typeof settings.sourceLanguageFilePath === "object" &&
			(Object.keys(settings.pathPattern).length !==
				Object.keys(settings.sourceLanguageFilePath).length ||
				!Object.keys(settings.pathPattern).every((key) =>
					// @ts-ignore
					Object.keys(settings.sourceLanguageFilePath).includes(key)
				))
		) {
			throw new Error(
				"The sourceLanguageFilePath setting must have the same namespaces as the pathPattern setting."
			)
		}
	}
}

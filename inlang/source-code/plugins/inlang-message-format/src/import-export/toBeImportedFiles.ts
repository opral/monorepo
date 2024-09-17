import { PLUGIN_KEY, type plugin } from "../plugin.js"

export const toBeImportedFiles: NonNullable<(typeof plugin)["toBeImportedFiles"]> = async ({
	settings,
}) => {
	const result = []
	const pluginSettings = settings[PLUGIN_KEY]
	if (pluginSettings === undefined) {
		return []
	}
	for (const locale of settings.locales) {
		if (pluginSettings.pathPattern.includes("{languageTag}")) {
			result.push({
				locale,
				path: pluginSettings.pathPattern.replace("{languageTag}", locale),
			})
		} else {
			result.push({
				locale,
				path: pluginSettings.pathPattern.replace("{locale}", locale),
			})
		}
	}
	return result
}

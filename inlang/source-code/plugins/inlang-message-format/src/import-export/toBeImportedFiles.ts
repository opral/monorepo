import { PLUGIN_KEY, type plugin } from "../plugin.js"

export const toBeImportedFiles: NonNullable<(typeof plugin)["toBeImportedFiles"]> = async ({
	settings,
}) => {
	const result = []
	const pathPattern = settings[PLUGIN_KEY]?.pathPattern
	if (pathPattern === undefined) {
		return []
	}
	for (const locale of settings.locales) {
		if (pathPattern.includes("{languageTag}")) {
			result.push({
				locale,
				path: pathPattern.replace("{languageTag}", locale),
			})
		} else {
			result.push({
				locale,
				path: pathPattern.replace("{locale}", locale),
			})
		}
	}
	return result
}

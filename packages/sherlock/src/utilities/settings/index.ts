import * as vscode from "vscode"

// TODO: migrate previewLanguageTag to previewLocale and adjust documentation
const settingsProperty = [
	"userId",
	"disableRecommendation",
	"disableConfigFileCreation",
	"disableConfigFileDeletion",
	"previewLanguageTag",
	"editorColors.info.foreground",
	"editorColors.info.background",
	"editorColors.info.border",
	"editorColors.error.foreground",
	"editorColors.error.background",
	"editorColors.error.border",
	"extract.generator",
	"extract.autoHumanId.enabled", // DEPRECATED, TODO: remove in the next major
	"inlineAnnotations.enabled",
	"appRecommendations.ninja.enabled",
] as const

type SettingsProperty = (typeof settingsProperty)[number]

/**
 * Updates a configuration setting with the specified value.
 * @param {string} property - The name of the configuration property to update.
 * @param {any} value - The new value for the configuration property.
 * @returns {Promise<void>} - A Promise that resolves once the configuration property has been updated.
 */
export const updateSetting = async (property: SettingsProperty, value: any): Promise<void> => {
	await vscode.workspace.getConfiguration("sherlock").update(property, value, true)
}

/**
 * Gets a configuration setting value.
 * @param {string} property - The name of the configuration property to get, supports dot notation.
 * @returns {Promise<any>} - A Promise that resolves to the configuration property value.
 * @throws {Error} - Throws an error if the configuration property is not found.
 *
 */
export const getSetting = async (property: SettingsProperty): Promise<any> => {
	const value = vscode.workspace.getConfiguration("sherlock").get(property)
	if (value === undefined) {
		throw new Error(`Could not find configuration property ${property}`)
	}
	return value
}

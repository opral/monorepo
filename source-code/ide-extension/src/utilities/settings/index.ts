import * as vscode from "vscode"

type SettingsProperty = "userId" | "disableRecommendation" | "disableConfigFileCreation"

/**
 * Updates a configuration setting with the specified value.
 * @param {string} property - The name of the configuration property to update.
 * @param {any} value - The new value for the configuration property.
 * @returns {Promise<void>} - A Promise that resolves once the configuration property has been updated.
 */
export const updateSetting = async (property: SettingsProperty, value: any): Promise<void> => {
	await vscode.workspace.getConfiguration("inlang").update(property, value, true)
}

/**
 * Gets a configuration setting value.
 * @param {string} property - The name of the configuration property to get.
 * @returns {Promise<any>} - A Promise that resolves to the configuration property value.
 * @throws {Error} - Throws an error if the configuration property is not found.
 *
 */
export const getSetting = async (property: SettingsProperty): Promise<any> => {
	const value = vscode.workspace.getConfiguration("inlang").get(property)
	if (value === undefined) {
		throw new Error(`Could not find configuration property ${property}`)
	}
	return value
}

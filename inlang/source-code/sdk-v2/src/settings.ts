import { tryCatch } from "@inlang/result"

import { ProjectSettingsFileJSONSyntaxError, ProjectSettingsInvalidError } from "./errors.js"

import { ValueErrorType } from "@sinclair/typebox/compiler"
import { ProjectSettings2 } from "./types/project-settings.js"

export async function loadSettings(args: {
	settingsFileContent: ArrayBuffer
}): Promise<ProjectSettings2> {
	const decoder = new TextDecoder("utf-8")
	const settingsFileString = decoder.decode(args.settingsFileContent)

	const json = tryCatch(() => JSON.parse(settingsFileString))

	if (json.error) {
		throw new ProjectSettingsFileJSONSyntaxError({
			cause: json.error,
			path: "fix error...",
		})
	}

	const projectSettings = parseSettings(json.data)

	// TODO SDK-v2 SETTINGS @NilsJacobsen can i drop this? - Add legacy fields - needed for settings component to work, check how we can get rid of those
	// @ts-ignore
	projectSettings.languageTags = projectSettings.locales
	// @ts-ignore
	projectSettings.sourceLanguageTag = projectSettings.baseLocale
	return projectSettings
}

const parseSettings = (settings: unknown) => {
	// TODO SDK-v2 SETTINGS check how we want to deal with migration here
	// const settingsCompiler = TypeCompiler.Compile(ProjectSettings2)
	// const withMigration = migrateIfOutdated(settings as any)
	// if (settingsCompiler.Check(withMigration) === false) {
	// 	const typeErrors = [...settingsCompiler.Errors(settings)]
	// 	if (typeErrors.length > 0) {
	// 		throw new ProjectSettingsInvalidError({
	// 			errors: typeErrors,
	// 		})
	// 	}
	// }

	const { baseLocale, locales } = settings as ProjectSettings2
	if (!locales.includes(baseLocale)) {
		throw new ProjectSettingsInvalidError({
			errors: [
				{
					message: `The baseLocale "${baseLocale}" is not included in the locales "${locales.join(
						'", "'
					)}". Please add it to the locales.`,
					type: ValueErrorType.String,
					schema: ProjectSettings2,
					value: baseLocale,
					path: "baseLocale",
				},
			],
		})
	}

	// TODO SDK-v2 SETTINGS check migration (the new project settings changes to locales and baseLocale!)
	return settings as unknown as ProjectSettings2
}

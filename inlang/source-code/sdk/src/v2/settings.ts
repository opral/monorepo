import { tryCatch } from "@inlang/result"
import type { NodeishFilesystemSubset } from "./types/plugin.js"
import {
	ProjectSettingsFileJSONSyntaxError,
	ProjectSettingsFileNotFoundError,
	ProjectSettingsInvalidError,
} from "../errors.js"
import { migrateIfOutdated } from "@inlang/project-settings/migration"
import { TypeCompiler, ValueErrorType } from "@sinclair/typebox/compiler"
import { ProjectSettings2 } from "./types/project-settings.js"

export async function loadSettings(args: {
	settingsFilePath: string
	nodeishFs: NodeishFilesystemSubset
}): Promise<ProjectSettings2> {
	const { data: settingsFile, error: settingsFileError } = await tryCatch(
		async () => await args.nodeishFs.readFile(args.settingsFilePath, { encoding: "utf-8" })
	)
	if (settingsFileError)
		throw new ProjectSettingsFileNotFoundError({
			cause: settingsFileError,
			path: args.settingsFilePath,
		})

	const json = tryCatch(() => JSON.parse(settingsFile))

	if (json.error) {
		throw new ProjectSettingsFileJSONSyntaxError({
			cause: json.error,
			path: args.settingsFilePath,
		})
	}
	return parseSettings(json.data)
}

const parseSettings = (settings: unknown) => {
	// const settingsCompiler = TypeCompiler.Compile(ProjectSettings2)
	const withMigration = migrateIfOutdated(settings as any)
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

	// TODO SDK2 check migration (the new project settings changes to locales and baseLocale!)
	return withMigration as unknown as ProjectSettings2
}

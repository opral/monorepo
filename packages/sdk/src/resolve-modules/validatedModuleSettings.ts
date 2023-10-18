import { Value } from "@sinclair/typebox/value"
class ModuleSettingsInvalidError extends Error {
	constructor(options: { id: any["id"]; cause: ErrorOptions["cause"] }) {
		super(
			`The plugin "${options.id}" returned an invalid schema. Please check the ${options.cause}.`
		)
		this.name = "ModuleSettingsInvalidError"
	}
}

export const validatedModuleSettings = (args: { resolvedModules: any; settings: any }) => {
	// console.log(count, "args.settings", args.settings)
	const result: any = {
		data: [],
		errors: [],
	}

	if (args.resolvedModules.settingSchema && args.settings[args.resolvedModules.id]) {
		const hasValidSettings = Value.Check(
			args.resolvedModules.settingSchema,
			args.settings[args.resolvedModules.id]
		)
		if (hasValidSettings === false) {
			const errors = [
				...Value.Errors(args.resolvedModules.settingSchema, args.settings[args.resolvedModules.id]),
			]
			result.errors.push(
				new ModuleSettingsInvalidError({
					id: args.resolvedModules.id,
					cause: JSON.stringify(errors),
				})
			)
		}

		if (result.errors != 0) {
			throw result.errors
		}
	}
}

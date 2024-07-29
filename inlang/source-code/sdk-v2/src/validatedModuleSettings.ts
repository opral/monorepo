import type { TSchema } from "@sinclair/typebox"
import { Value, type ValueError } from "@sinclair/typebox/value"
import type { InlangPlugin } from "./types/module.js"

export const validatedModuleSettings = (args: {
	settingsSchema: InlangPlugin["default"]["settingsSchema"]
	moduleSettings: unknown
}): "isValid" | ValueError[] => {
	if (args.settingsSchema && args.moduleSettings) {
		const hasValidSettings = Value.Check(args.settingsSchema as TSchema, args.moduleSettings)

		if (hasValidSettings === false) {
			const errors = [...Value.Errors(args.settingsSchema as TSchema, args.moduleSettings)]

			return errors
		}
	}
	return "isValid"
}


import type { TSchema } from "@sinclair/typebox"
import { Value, type ValueError } from "@sinclair/typebox/value"
import type { InlangModule } from "../index.js"

export const validatedModuleSettings = (args: {
	settingsSchema: InlangModule["default"]["settingsSchema"]
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

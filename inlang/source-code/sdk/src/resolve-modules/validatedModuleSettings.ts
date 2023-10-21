import type { InlangModule } from "@inlang/module"
import { Value, type ValueError } from "@sinclair/typebox/value"

export const validatedModuleSettings = (args: {
	settingsSchema: InlangModule["default"]["settingsSchema"]
	moduleSettings: unknown
}): "isValid" | ValueError[] => {
	if (args.settingsSchema && args.moduleSettings) {
		const hasValidSettings = Value.Check(args.settingsSchema, args.moduleSettings)

		if (hasValidSettings === false) {
			const errors = [...Value.Errors(args.settingsSchema, args.moduleSettings)]

			return errors
		}
	}
	return "isValid"
}

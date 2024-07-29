import type { TSchema } from "@sinclair/typebox"
import { Value, type ValueError } from "@sinclair/typebox/value"
import type { InlangPlugin } from "./types/plugin.js"

export const validatedPluginSettings = (args: {
	settingsSchema: InlangPlugin["default"]["settingsSchema"]
	pluginSettings: unknown
}): "isValid" | ValueError[] => {
	if (args.settingsSchema && args.pluginSettings) {
		const hasValidSettings = Value.Check(args.settingsSchema as TSchema, args.pluginSettings)

		if (hasValidSettings === false) {
			const errors = [...Value.Errors(args.settingsSchema as TSchema, args.pluginSettings)]

			return errors
		}
	}
	return "isValid"
}

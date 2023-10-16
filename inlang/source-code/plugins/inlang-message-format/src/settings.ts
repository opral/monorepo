import { object, string, type Output, endsWith, regex } from "valibot"

/**
 * Using valibot instead of typebox because it is tree-shakable.
 *
 * See https://github.com/sinclairzx81/typebox/discussions/614
 */
export type PluginSettings = Output<typeof PluginSettings>
export const PluginSettings = object({
	/**
	 * The path to the JSON file where the messages are stored.
	 *
	 * - Must start with "./".
	 * - Must end with ".json".
	 *
	 * @example "./messages.json"
	 * @example "./src/messages.json"
	 * @example "../messages.json"
	 */
	filePath: string([regex(/^(\.)|(\/)/), endsWith(".json")]),
})

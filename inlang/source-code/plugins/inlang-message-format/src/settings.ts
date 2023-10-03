import { object, string, type Output, startsWith, endsWith } from "valibot"

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
	 */
	storagePath: string([startsWith("./"), endsWith(".json")]),
})

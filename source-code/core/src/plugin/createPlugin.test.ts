import { it, expect } from "vitest"
import { createPlugin } from "./createPlugin.js"
import type { EnvironmentFunctions } from "../config/schema.js"

it("should be possible to define a plugin", () => {
	const myPlugin = createPlugin<{ pathPattern: string }>(({ settings }) => {
		return {
			id: "samuelstroschein.plugin-json",
			config: () => {
				if (settings.pathPattern === undefined) {
					throw new Error("pathPattern is required")
				}
				return {
					languages: ["en", "de"],
				}
			},
		}
	})

	const plugin = myPlugin({ pathPattern: "" })({} as EnvironmentFunctions)
	expect(plugin.id).toEqual("samuelstroschein.plugin-json")
	expect(plugin.config()).toEqual({
		languages: ["en", "de"],
	})
})

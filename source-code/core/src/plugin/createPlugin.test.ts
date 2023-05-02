import { it, expect } from "vitest"
import { createPlugin } from "./createPlugin.js"
import type { InlangEnvironment } from "../environment/types.js"

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

	const plugin = myPlugin({ pathPattern: "" })({} as InlangEnvironment)
	expect(plugin.id).toEqual("samuelstroschein.plugin-json")
	expect(plugin.config({})).toEqual({
		languages: ["en", "de"],
	})
})

it("config function should receive config object", () => {
	const myPlugin = createPlugin(() => {
		return {
			id: "inlang.identity",
			config: (config) => {
				return {
					referenceLanguage: config.referenceLanguage
				}
			},
		}
	})

	const plugin = myPlugin()({} as InlangEnvironment)
	expect(plugin.config({ referenceLanguage: 'it' })).toEqual({
		referenceLanguage: 'it'
	})
})

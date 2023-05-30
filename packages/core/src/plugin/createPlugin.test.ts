import { it, expect } from "vitest"
import { createPlugin } from "./createPlugin.js"
import type { InlangEnvironment } from "../environment/types.js"
import { expectType } from "tsd"

it("should be possible to define a plugin without settings and the type should be undefined", () => {
	createPlugin(({ settings }) => {
		expectType<undefined>(settings)
		return {} as any
	})
})

it('should have defined settings if "createPlugin" is called with a settings type', () => {
	createPlugin<{ pathPattern: string }>((args) => {
		expectType<object>(args.settings)
		expectType<string>(args.settings?.pathPattern)
		return {} as any
	})
})

it("should be possible to define a plugin", () => {
	const myPlugin = createPlugin<{ pathPattern: string }>(({ settings }) => {
		return {
			id: "samuelstroschein.plugin-json",
			config: () => {
				if (settings?.pathPattern === undefined) {
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
					referenceLanguage: config.referenceLanguage,
				}
			},
		}
	})

	const plugin = myPlugin()({} as InlangEnvironment)
	expect(plugin.config({ referenceLanguage: "it" })).toEqual({
		referenceLanguage: "it",
	})
})

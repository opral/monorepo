import { it, expect } from "vitest"
import { createPlugin } from "./createPlugin.js"
import { setupPlugins } from "./setupPlugins.js"

const mockPlugin = createPlugin(() => {
	return {
		id: "mock.plugin",
		config: () => {
			return {
				languages: ["en", "de"],
			}
		},
	}
})

it("should define plugins as an empty array if no plugins are defined", async () => {
	const config = await setupPlugins({
		config: {},
		env: {} as any,
	})
	expect(config.plugins).toEqual([])
})

it("should be possible to define a config with plugins", async () => {
	const config = await setupPlugins({
		config: {
			referenceLanguage: "de",
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(config.referenceLanguage).toEqual("de")
	expect(config.plugins[0]!.id).toEqual("mock.plugin")
	expect(config.languages).toEqual(["en", "de"])
})

it("should merge languages without duplicates", async () => {
	const config = await setupPlugins({
		config: {
			languages: ["fr", "nl", "en"],
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(config.languages).toEqual(["fr", "nl", "en", "de"])
})

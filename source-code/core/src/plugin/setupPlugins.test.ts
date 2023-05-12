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
	const [config, errors] = await setupPlugins({
		config: {},
		env: {} as any,
	})
	expect(config.plugins).toEqual([])
	expect(errors).toBeUndefined()
})

it("should be possible to define a config with plugins", async () => {
	const [config, errors] = await setupPlugins({
		config: {
			referenceLanguage: "de",
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(errors).toBeUndefined()
	expect(config.referenceLanguage).toEqual("de")
	expect(config.plugins[0]!.id).toEqual("mock.plugin")
	expect(config.languages).toEqual(["en", "de"])
})

// Plugins are unaware of each other, so it's possible to define the same
// language in multiple plugins. This is not a problem, but the languages
// should be merged without duplicates.
it("should merge languages without duplicates", async () => {
	const [config, errors] = await setupPlugins({
		config: {
			languages: ["fr", "nl", "en"],
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(errors).toBeUndefined()
	expect(config.languages).toEqual(["fr", "nl", "en", "de"])
})

it("should not fail if one plugin crashes", async () => {
	const [config, errors] = await setupPlugins({
		config: {
			plugins: [
				mockPlugin(),
				{
					id: "crashing.plugin",
					config: () => {
						throw new Error("Plugin crashed")
					},
				},
			],
		},
		env: {} as any,
	})
	expect(config.languages).toEqual(["en", "de"])
	expect(errors).toHaveLength(1)
})

it("should merge config and pass to all plugins in sequence", async () => {
	let config1: Record<string, unknown> = {}
	let config2: Record<string, unknown> = {}
	let config3: Record<string, unknown> = {}

	const [config, errors]: [Record<string, unknown>, any] = (await setupPlugins({
		config: {
			plugins: [
				{
					id: "test.1",
					config(config) {
						config1 = config

						return {
							test1: true,
						}
					},
				},
				{
					id: "test.2",
					config(config) {
						config2 = config

						return {
							test2: true,
						}
					},
				},
				{
					id: "test.3",
					config(config) {
						config3 = config

						delete (config as Record<string, unknown>).test1

						return {
							test3: true,
						}
					},
				},
			],
		},
		env: {} as any,
	})) as any

	expect(errors).toBeUndefined()

	expect(config.test1).toBe(true)
	expect(config.test2).toBe(true)
	expect(config.test3).toBe(true)

	expect(config1.test1).toBe(undefined)

	expect(config2.test1).toBe(true)
	expect(config2.test2).toBe(undefined)

	expect(config3.test1).toBe(undefined)
	expect(config3.test2).toBe(true)
	expect(config3.test3).toBe(undefined)
})

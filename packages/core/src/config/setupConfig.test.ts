import { it, expect } from "vitest"
import { setupConfig } from "./setupConfig.js"
import type { DefineConfig } from "./schema.js"

it("should setup the config with plugins", async () => {
	const config = await setupConfig({
		module: {
			defineConfig: mockDefineConfig,
		},
		env: {} as any,
	})
	expect(config.referenceLanguage).toEqual("de")
	expect(config.languages).toEqual(["en", "de"])
})

// Zod removes properties 
it("should not remove properties from the config", async () => {
	const config = await setupConfig({
		module: {
			defineConfig: async () => ({
				readResources: () => undefined as any,
				writeResources: () => undefined as any,
				someProperty: "someValue",
				plugins: [
					{
						id: "mock.plugin",
						config: () => {
							return {
								referenceLanguage: "de",
								languages: ["en", "de"],
							}
						},
					},
				],
			}),
		},
		env: {} as any,
	})
	// @ts-expect-error
	expect(config.someProperty).toBe("someValue")
})

const mockDefineConfig: DefineConfig = async () => ({
	readResources: () => undefined as any,
	writeResources: () => undefined as any,
	plugins: [
		{
			id: "mock.plugin",
			config: () => {
				return {
					referenceLanguage: "de",
					languages: ["en", "de"],
				}
			},
		},
	],
})

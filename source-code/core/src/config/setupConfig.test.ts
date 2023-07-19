import { it, expect, vi } from "vitest"
import { setupConfig } from "./setupConfig.js"
import { createMessage } from "../test/utils.js"
import type { Message } from "../ast/index.js"

it("should setup the config with plugins", async () => {
	const config = await setupConfig({
		module: {
			defineConfig: async () => ({
				getMessages: async () => mockResource,
				writeResources: async () => undefined,
				plugins: [
					{
						id: "mock.plugin",
						config: () => {
							return {
								sourceLanguageTag: "de",
								languageTags: ["en", "de"],
							}
						},
					},
				],
			}),
		},
		env: {} as any,
	})
	expect(config.sourceLanguageTag).toEqual("de")
	expect(config.languageTags).toEqual(["en", "de"])
})

// Zod removes properties
it("should not remove properties from the config", async () => {
	const config = await setupConfig({
		module: {
			defineConfig: async () => ({
				readResources: async () => mockResource,
				writeResources: async () => undefined,
				someProperty: "someValue",
				plugins: [
					{
						id: "mock.plugin",
						config: () => {
							return {
								sourceLanguageTag: "de",
								languageTags: ["en", "de"],
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

it("should throw if the module has no define config function", async () => {
	expect(
		setupConfig({
			// @ts-expect-error
			module: {},
			env: {} as any,
		}),
	).rejects.toBeTruthy()
})

it("should throw if the config is invalid", async () => {
	expect(
		setupConfig({
			module: {
				defineConfig: async () => ({
					writeResources: async () => undefined,
					someProperty: "someValue",
					plugins: [
						{
							id: "mock.plugin",
							config: () => {
								return {
									sourceLanguageTag: "de",
									languageTags: ["en", "de"],
								}
							},
						},
					],
				}),
			},
			env: {} as any,
		}),
	).rejects.toBeTruthy()
})

// if the minimal config to run the app is valid, the app start not crash but
// the plugin errors should be logged
it("should NOT throw if the config is valid but a plugin has an error", async () => {
	vi.spyOn(console, "error").mockImplementation(() => undefined)

	try {
		await setupConfig({
			module: {
				defineConfig: async () => ({
					sourceLanguageTag: "de",
					languageTags: ["de", "en"],
					readResources: async () => mockResource,
					writeResources: async () => undefined,
					plugins: [
						{
							id: "mock.plugin",
							config: () => {
								throw new Error("Plugin crashed")
							},
						},
					],
				}),
			},
			env: {} as any,
		})
		expect(console.error).toHaveBeenCalledOnce()
	} catch (error) {
		expect(error).toBeFalsy()
	}
})

const mockResource: Message[] = [
	createMessage("first-message", "en", "test"),
	createMessage("second-message", "de", "test"),
]

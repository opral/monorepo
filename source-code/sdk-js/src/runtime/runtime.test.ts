import type { Resource } from "@inlang/core/ast"
import { createResource, createMessage } from "@inlang/core/test"
import { describe, expect, test } from "vitest"
import { initBaseRuntime, initRuntime, initRuntimeWithLanguageInformation, RuntimeContext, RuntimeState } from "./runtime.js"

// --------------------------------------------------------------------------------------------------------------------

const resources = {
	en: createResource("en", createMessage("hello", "world")),
	de: createResource("de", createMessage("hello", "Welt")),
	fr: createResource("fr", createMessage("hello", "monde")),
}

const context: RuntimeContext<string, Promise<Resource | undefined>> = {
	readResource: (language) => Promise.resolve(resources[language as keyof typeof resources]),
}

describe("initRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initRuntime(context)

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.language).toBeUndefined()
		expect(runtime.i).toBeDefined()

		runtime.switchLanguage("")
		expect(runtime.language)
	})
})

describe("initBaseRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initBaseRuntime(context)

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.language).toBeUndefined()
		expect(runtime.i).toBeDefined()

		runtime.switchLanguage("")
		expect(runtime.language).toBeDefined()
	})

	describe("loadResource", () => {
		test("it should load a resource", async () => {
			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)
			expect(state.resources.size).toBe(0)

			await runtime.loadResource("en")
			expect(state.resources.get("en")).toBe(resources.en)
			expect(state.resources.size).toBe(1)

			await runtime.loadResource("de")
			expect(state.resources.get("de")).toBe(resources.de)
			expect(state.resources.size).toBe(2)
		})

		test("it should not fail if a resource was not found", async () => {
			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			await runtime.loadResource("it")

			expect(state.resources.get("it")).toBeUndefined()
			expect(state.resources.size).toBe(0)
		})

		test("it should be able to load resources sync", async () => {
			const context: RuntimeContext<string, Resource | undefined> = {
				readResource: (language) => resources[language as keyof typeof resources],
			}

			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			runtime.loadResource("fr")

			expect(state.resources.get("fr")).toBeDefined()
			expect(state.resources.size).toBe(1)
		})

		test("it should allow to call loadResource multiple times", async () => {
			const runtime = initBaseRuntime(context)
			await expect(runtime.loadResource('de')).resolves.toBeUndefined()
			await expect(runtime.loadResource('de')).resolves.toBeUndefined()
		})

		test("it should cache multiple loadResource calls with the same params", async () => {
			const runtime = initBaseRuntime(context)
			const p1 = runtime.loadResource('de')
			const p2 = runtime.loadResource('de')
			const p3 = runtime.loadResource('it')

			expect(p1).toBe(p2) // same language
			expect(p1).not.toBe(p3) // different language

			await p2

			const p4 = runtime.loadResource('de')
			expect(p1).not.toBe(p4) // previous promise was resolved
		})

		test("it should return the already loaded resource for multiple loadResource calls with the same params", async () => {
			const context: RuntimeContext<string, Resource | undefined> = {
				readResource: (language) => resources[language as keyof typeof resources],
			}
			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)
			expect(state.resources.size).toBe(0)
			runtime.loadResource('de')
			expect(state.resources.size).toBe(1)
			runtime.loadResource('de')
			expect(state.resources.size).toBe(1)
		})
	})

	describe("switchLanguage", () => {
		test("it should switch the language", () => {
			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			expect(state.language).toBe("en")

			runtime.switchLanguage("fr")

			expect(state.language).toBe("fr")
		})
	})

	describe("language", () => {
		test("it should return undefined if language was never set", () => {
			const runtime = initBaseRuntime(context)

			expect(runtime.language).toBeUndefined()
		})

		test("it should return the current language", () => {
			const state = {
				language: "en",
				resources: new Map(),
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			state.language = "de"

			expect(runtime.language).toBe("de")
		})
	})

	describe("i", () => {
		test("it should not throw if language was never set", () => {
			const runtime = initBaseRuntime(context)

			expect(runtime.i("test")).toBe("")
		})

		test("it should not create multiple instances", async () => {
			const runtime = initBaseRuntime(context)
			await runtime.loadResource('de')
			runtime.switchLanguage('de')

			const i1 = runtime.i
			const i2 = runtime.i
			expect(i1).toBe(i2)
		})

		test("it should return the inlang function for the current language", async () => {
			const runtime = initBaseRuntime(context)

			await runtime.loadResource("en")
			runtime.switchLanguage("en")

			expect(runtime.i("hello")).toBe("world")
		})
	})

	describe("should not share state between instances", () => {
		test("language", () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

			runtime1.switchLanguage("en")
			runtime2.switchLanguage("de")

			expect(runtime1.language).toBe("en")
			expect(runtime2.language).toBe("de")
		})

		test("inlang function", async () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

			await runtime1.loadResource("de")
			runtime1.switchLanguage("de")

			await runtime2.loadResource("fr")
			runtime2.switchLanguage("fr")

			expect(runtime1.i("hello")).toBe("Welt")
			expect(runtime2.i("hello")).toBe("monde")

			runtime1.switchLanguage("fr")
			runtime2.switchLanguage("de")

			expect(runtime1.i("hello")).toBe("")
			expect(runtime2.i("hello")).toBe("")
		})
	})
})

describe('initRuntimeWithLanguageInformation', () => {
	test("it should create a runtime with the passed language information", async () => {
		const runtime = initRuntimeWithLanguageInformation({
			referenceLanguage: 'fr',
			languages: ['fr', 'it'],
			readResource: (language) => resources[language as keyof typeof resources]
		})

		expect(runtime.referenceLanguage).toBe('fr')
		expect(runtime.languages).toEqual(['fr', 'it'])
		const i = runtime.i
		expect(i).toBeDefined()
		expect(i('')).toBe('')
		expect(runtime.switchLanguage).toBeDefined()
		runtime.switchLanguage('fr')
		expect(runtime.loadResource).toBeDefined()
		expect(runtime.language).toBe('fr')
	})
})
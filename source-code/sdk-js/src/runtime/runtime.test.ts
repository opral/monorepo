import { describe, expect, test } from "vitest"
import { initBaseRuntime, initRuntime, RuntimeState } from "./runtime.js"

describe("initRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initRuntime()

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.getLanguage).toBeDefined()
		expect(runtime.getLookupFunction).toBeDefined()
	})
})

describe("initBaseRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initBaseRuntime()

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.getLanguage).toBeDefined()
		expect(runtime.getLookupFunction).toBeDefined()
	})

	describe("loadResource", () => {
		// TODO: implement `loadResource`
		test.todo("it should load a resource")
	})

	describe("switchLanguage", () => {
		test("it should switch the language", () => {
			const state = {
				language: "en",
				resources: new Map(),
			} satisfies RuntimeState

			const runtime = initBaseRuntime(state)

			expect(state.language).toBe("en")

			runtime.switchLanguage("fr")

			expect(state.language).toBe("fr")
		})
	})

	describe("getLanguage", () => {
		test("it should return undefined if language was never set", () => {
			const runtime = initBaseRuntime()

			expect(runtime.getLanguage()).toBeUndefined()
		})

		test("it should return the current language", () => {
			const state = {
				language: "en",
				resources: new Map(),
			} satisfies RuntimeState

			const runtime = initBaseRuntime(state)

			state.language = "de"

			expect(runtime.getLanguage()).toBe("de")
		})
	})

	describe("getLookupFunction", () => {
		test("it should not throw if language was never set", () => {
			const runtime = initBaseRuntime()

			const i = runtime.getLookupFunction()

			expect(i("test")).toBe("")
		})

		// TODO: implement `loadResource`
		test.skip("it should return the lookup function for the current language", async () => {
			const runtime = initBaseRuntime()

			await runtime.loadResource("en")
			runtime.switchLanguage("en")

			const i = runtime.getLookupFunction()

			expect(i("hello")).toBe("world")
		})
	})

	describe("should not share state between instances", () => {
		test("language", () => {
			const runtime1 = initBaseRuntime()
			const runtime2 = initBaseRuntime()

			runtime1.switchLanguage("en")
			runtime2.switchLanguage("de")

			expect(runtime1.getLanguage()).toBe("en")
			expect(runtime2.getLanguage()).toBe("de")
		})

		// TODO: implement `loadResource`
		test.todo("lookup function", async () => {
			const runtime1 = initBaseRuntime()
			const runtime2 = initBaseRuntime()

			await runtime1.loadResource("de")
			runtime1.switchLanguage("de")

			await runtime2.loadResource("fr")
			runtime2.switchLanguage("fr")

			const i1 = runtime1.getLookupFunction()
			const i2 = runtime2.getLookupFunction()

			expect(i1("hello")).toBe("Welt")
			expect(i2("hello")).toBe("monde")

			runtime1.switchLanguage("fr")
			const i1fr = runtime1.getLookupFunction()

			runtime2.switchLanguage("de")
			const i2de = runtime2.getLookupFunction()

			expect(i1fr("hello")).toBe("")
			expect(i2de("hello")).toBe("")
		})
	})
})

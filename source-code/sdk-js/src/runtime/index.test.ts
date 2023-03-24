import { describe, expect, test } from "vitest"
import { initRuntime } from "./index.js"

describe("initRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initRuntime()

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.getCurrentLanguage).toBeDefined()
		expect(runtime.getLookupFunctionForCurrentLanguage).toBeDefined()
	})

	describe("loadResource", () => {
		// TODO: implement `loadResource`
		test.todo("it should load a resource")
	})

	describe("switchLanguage", () => {
		test("it should switch the language", () => {
			const runtime = initRuntime()

			expect(runtime.getCurrentLanguage()).toBeUndefined()

			runtime.switchLanguage("en")

			expect(runtime.getCurrentLanguage()).toBe("en")
		})
	})

	describe("getCurrentLanguage", () => {
		test("it should return undefined if language was never set", () => {
			const runtime = initRuntime()

			expect(runtime.getCurrentLanguage()).toBeUndefined()
		})

		test("it should return the current language", () => {
			const runtime = initRuntime()

			runtime.switchLanguage("en")

			expect(runtime.getCurrentLanguage()).toBe("en")
		})
	})

	describe("getLookupFunctionForCurrentLanguage", () => {
		test("it should not throw if language was never set", () => {
			const runtime = initRuntime()

			const i = runtime.getLookupFunctionForCurrentLanguage()

			expect(i("test")).toBe("")
		})

		// TODO: implement `loadResource`
		test.skip("it should return the lookup function for the current language", async () => {
			const runtime = initRuntime()

			await runtime.loadResource("en")
			runtime.switchLanguage("en")

			const i = runtime.getLookupFunctionForCurrentLanguage()

			expect(i("hello")).toBe("world")
		})
	})

	describe("should not share state between instances", () => {
		test("language", () => {
			const runtime1 = initRuntime()
			const runtime2 = initRuntime()

			runtime1.switchLanguage("en")
			runtime2.switchLanguage("de")

			expect(runtime1.getCurrentLanguage()).toBe("en")
			expect(runtime2.getCurrentLanguage()).toBe("de")
		})

		// TODO: implement `loadResource`
		test.todo("lookup function", async () => {
			const runtime1 = initRuntime()
			const runtime2 = initRuntime()

			await runtime1.loadResource("de")
			runtime1.switchLanguage("de")

			await runtime2.loadResource("fr")
			runtime2.switchLanguage("fr")

			const i1 = runtime1.getLookupFunctionForCurrentLanguage()
			const i2 = runtime2.getLookupFunctionForCurrentLanguage()

			expect(i1("hello")).toBe("Welt")
			expect(i2("hello")).toBe("monde")

			runtime1.switchLanguage("fr")
			const i1fr = runtime1.getLookupFunctionForCurrentLanguage()

			runtime2.switchLanguage("de")
			const i2de = runtime2.getLookupFunctionForCurrentLanguage()

			expect(i1fr("hello")).toBe("")
			expect(i2de("hello")).toBe("")
		})
	})
})

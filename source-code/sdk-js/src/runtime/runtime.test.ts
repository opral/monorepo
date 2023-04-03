import type { Language, Message, Resource } from "@inlang/core/ast"
import { describe, expect, test } from "vitest"
import { initBaseRuntime, initRuntime, RuntimeContext, RuntimeState } from "./runtime.js"

// this is a copy from `source-code/core/src/lint/linter.test.ts`
// TODO: expose utility functions somewhere

const createResource = (language: Language, ...messages: Message[]) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: messages,
	} satisfies Resource)

const createMessage = (id: string, pattern: string) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: {
			type: "Pattern",
			elements: [{ type: "Text", value: pattern }],
		},
	} satisfies Message)

// --------------------------------------------------------------------------------------------------------------------

const resources = {
	en: createResource("en", createMessage("hello", "world")),
	de: createResource("de", createMessage("hello", "Welt")),
	fr: createResource("fr", createMessage("hello", "monde")),
}

const context: RuntimeContext = {
	readResource: (language) => Promise.resolve(resources[language as keyof typeof resources]),
}

describe("initRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initRuntime(context)

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.getLanguage).toBeDefined()
		expect(runtime.getLookupFunction).toBeDefined()
	})
})

describe("initBaseRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initBaseRuntime(context)

		expect(runtime.loadResource).toBeDefined()
		expect(runtime.switchLanguage).toBeDefined()
		expect(runtime.getLanguage).toBeDefined()
		expect(runtime.getLookupFunction).toBeDefined()
	})

	describe("loadResource", () => {
		test("it should load a resource", async () => {
			const state = {
				language: "en",
				resources: new Map(),
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
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			await runtime.loadResource("it")
			expect(state.resources.get("it")).toBeUndefined()

			expect(state.resources.size).toBe(0)
		})
	})

	describe("switchLanguage", () => {
		test("it should switch the language", () => {
			const state = {
				language: "en",
				resources: new Map(),
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			expect(state.language).toBe("en")

			runtime.switchLanguage("fr")

			expect(state.language).toBe("fr")
		})
	})

	describe("getLanguage", () => {
		test("it should return undefined if language was never set", () => {
			const runtime = initBaseRuntime(context)

			expect(runtime.getLanguage()).toBeUndefined()
		})

		test("it should return the current language", () => {
			const state = {
				language: "en",
				resources: new Map(),
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, state)

			state.language = "de"

			expect(runtime.getLanguage()).toBe("de")
		})
	})

	describe("getLookupFunction", () => {
		test("it should not throw if language was never set", () => {
			const runtime = initBaseRuntime(context)

			const i = runtime.getLookupFunction()

			expect(i("test")).toBe("")
		})

		test("it should return the lookup function for the current language", async () => {
			const runtime = initBaseRuntime(context)

			await runtime.loadResource("en")
			runtime.switchLanguage("en")

			const i = runtime.getLookupFunction()

			expect(i("hello")).toBe("world")
		})
	})

	describe("should not share state between instances", () => {
		test("language", () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

			runtime1.switchLanguage("en")
			runtime2.switchLanguage("de")

			expect(runtime1.getLanguage()).toBe("en")
			expect(runtime2.getLanguage()).toBe("de")
		})

		test("lookup function", async () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

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

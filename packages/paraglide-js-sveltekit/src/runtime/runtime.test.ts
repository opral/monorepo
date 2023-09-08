/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, test } from "vitest"
import {
	initBaseRuntime,
	initRuntime,
	initRuntimeWithLanguageInformation,
	type RuntimeContext,
	type RuntimeState,
} from "./runtime.js"
import type { Message } from "@inlang/sdk"
import { createMessage } from "@inlang/sdk/test-utilities"

// --------------------------------------------------------------------------------------------------------------------

const messageMap = {
	en: [createMessage("hello", { en: "world" })],
	de: [createMessage("hello", { de: "Welt" })],
	fr: [createMessage("hello", { fr: "monde" })],
}

const context: RuntimeContext<string, Promise<Message[] | undefined>> = {
	loadMessages: (languageTag) =>
		Promise.resolve(messageMap[languageTag as keyof typeof messageMap]),
}

describe("initRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initRuntime(context)

		expect(runtime.loadMessages).toBeDefined()
		expect(runtime.changeLanguageTag).toBeDefined()
		expect(runtime.languageTag).toBeUndefined()
		expect(runtime.i).toBeDefined()

		runtime.changeLanguageTag("")
		expect(runtime.languageTag)
	})
})

describe("initBaseRuntime", () => {
	test("it should provide all functions", () => {
		const runtime = initBaseRuntime(context)

		expect(runtime.loadMessages).toBeDefined()
		expect(runtime.changeLanguageTag).toBeDefined()
		expect(runtime.languageTag).toBeUndefined()
		expect(runtime.i).toBeDefined()

		runtime.changeLanguageTag("")
		expect(runtime.languageTag).toBeDefined()
	})

	describe("loadMessages", () => {
		test("it should load messages for a language", async () => {
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} as RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)
			expect(VirtualModule.messages).toHaveLength(0)

			await runtime.loadMessages("en")
			expect(VirtualModule.messages[0]!.variants).toMatchObject(messageMap.en[0]!.variants)
			expect(VirtualModule.messages[0]!.variants).toHaveLength(1)

			await runtime.loadMessages("de")

			expect(VirtualModule.messages[0]!.variants).toMatchObject([
				...messageMap.en[0]!.variants,
				...messageMap.de[0]!.variants,
			])
			expect(Object.keys(VirtualModule.messages[0]!.variants)).toHaveLength(2)
		})

		test("it should not fail if messages were not found", async () => {
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)

			await runtime.loadMessages("it")

			expect(VirtualModule.messages).toHaveLength(0)
		})

		test("it should be able to load messages sync", async () => {
			const context: RuntimeContext<string, Message[] | undefined> = {
				loadMessages: (languageTag) => messageMap[languageTag as keyof typeof messageMap],
			}

			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)

			runtime.loadMessages("fr")

			expect(VirtualModule.messages).toBeDefined()
			expect(VirtualModule.messages).toHaveLength(1)
		})

		test("it should allow to call loadMessages multiple times", async () => {
			const runtime = initBaseRuntime(context)
			await expect(runtime.loadMessages("de")).resolves.toBeUndefined()
			await expect(runtime.loadMessages("de")).resolves.toBeUndefined()
		})

		test("it should cache multiple loadMessages calls with the same params", async () => {
			const runtime = initBaseRuntime(context)
			const p1 = runtime.loadMessages("de")
			const p2 = runtime.loadMessages("de")
			const p3 = runtime.loadMessages("it")

			expect(p1).toBe(p2) // same languageTag
			expect(p1).not.toBe(p3) // different languageTag

			await p2

			const p4 = runtime.loadMessages("de")
			expect(p1).not.toBe(p4) // previous promise was resolved
		})

		test("it should return the already loaded messages for multiple loadMessages calls with the same params", async () => {
			const context: RuntimeContext<string, Message[] | undefined> = {
				loadMessages: (languageTag) => messageMap[languageTag as keyof typeof messageMap],
			}
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)
			expect(VirtualModule.messages).toHaveLength(0)
			runtime.loadMessages("de")
			expect(VirtualModule.messages).toHaveLength(1)
			runtime.loadMessages("de")
			expect(VirtualModule.messages).toHaveLength(1)
		})
	})

	describe("changeLanguageTag", () => {
		test("it should switch the languageTag", () => {
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)

			expect(VirtualModule.languageTag).toBe("en")

			runtime.changeLanguageTag("fr")

			expect(VirtualModule.languageTag).toBe("fr")
		})
	})

	describe("languageTag", () => {
		test("it should return undefined if languageTag was never set", () => {
			const runtime = initBaseRuntime(context)

			expect(runtime.languageTag).toBeUndefined()
		})

		test("it should return the current languageTag", () => {
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			} satisfies RuntimeState

			const runtime = initBaseRuntime(context, VirtualModule)

			VirtualModule.languageTag = "de"

			expect(runtime.languageTag).toBe("de")
		})
	})

	describe("i", () => {
		test("it should not throw if languageTag was never set", () => {
			const runtime = initBaseRuntime(context)

			expect(runtime.i("test")).toBe("")
		})

		test("it should not create multiple instances", async () => {
			const runtime = initBaseRuntime(context)
			await runtime.loadMessages("de")
			runtime.changeLanguageTag("de")

			const i1 = runtime.i
			const i2 = runtime.i
			expect(i1).toBe(i2)
		})

		test("it should return the inlang function for the current languageTag", async () => {
			const VirtualModule = {
				languageTag: "en",
				messages: [],
				i: undefined,
			}
			const runtime = initBaseRuntime(context, VirtualModule)

			await runtime.loadMessages("en")
			runtime.changeLanguageTag("en")

			expect(runtime.i("hello")).toBe("world")
		})
	})

	describe("should not share VirtualModule between instances", () => {
		test("languageTag", () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

			runtime1.changeLanguageTag("en")
			runtime2.changeLanguageTag("de")

			expect(runtime1.languageTag).toBe("en")
			expect(runtime2.languageTag).toBe("de")
		})

		test("inlang function", async () => {
			const runtime1 = initBaseRuntime(context)
			const runtime2 = initBaseRuntime(context)

			await runtime1.loadMessages("de")
			runtime1.changeLanguageTag("de")

			await runtime2.loadMessages("fr")
			runtime2.changeLanguageTag("fr")

			expect(runtime1.i("hello")).toBe("Welt")
			expect(runtime2.i("hello")).toBe("monde")

			runtime1.changeLanguageTag("fr")
			runtime2.changeLanguageTag("de")

			expect(runtime1.i("hello")).toBe("")
			expect(runtime2.i("hello")).toBe("")
		})
	})
})

describe("initRuntimeWithLanguageInformation", () => {
	test("it should create a runtime with the passed languageTag information", async () => {
		const runtime = initRuntimeWithLanguageInformation({
			sourceLanguageTag: "fr",
			languageTags: ["fr", "it"],
			loadMessages: (languageTag) => messageMap[languageTag as keyof typeof messageMap],
		})

		expect(runtime.sourceLanguageTag).toBe("fr")
		expect(runtime.languageTags).toEqual(["fr", "it"])
		const i = runtime.i
		expect(i).toBeDefined()
		expect(i("")).toBe("")
		expect(runtime.changeLanguageTag).toBeDefined()
		runtime.changeLanguageTag("fr")
		expect(runtime.loadMessages).toBeDefined()
		expect(runtime.languageTag).toBe("fr")
	})
})

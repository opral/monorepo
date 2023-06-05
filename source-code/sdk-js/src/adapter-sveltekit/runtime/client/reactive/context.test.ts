import { test, describe, expect, vi, beforeEach, Mock } from "vitest"
import { getRuntimeFromContext, addRuntimeToContext } from "./context.js"
import * as svelte from "svelte"
import { SvelteKitClientRuntime, initSvelteKitClientRuntime } from "../runtime.js"
import { get } from "svelte/store"
import { createResource } from "@inlang/core/test"

let mockedFetch: Mock
let runtime: SvelteKitClientRuntime

beforeEach(async () => {
	vi.resetAllMocks()

	let ctx: ReturnType<typeof getRuntimeFromContext>

	mockedFetch = vi.fn().mockImplementation(async (url) => {
		const language = url.endsWith("de.json") ? "de" : "en"
		return new Response(JSON.stringify(createResource(language)))
	})

	runtime = await initSvelteKitClientRuntime({
		fetch: mockedFetch,
		language: "en",
		languages: ["en", "de"],
		referenceLanguage: "en",
	})

	vi.mock("$app/navigation", () => ({ goto: vi.fn() }))
	vi.mock("$app/stores", () => ({ page: vi.fn() }))
	vi.mock('$app/paths', () => ({ base: '' }))
	vi.mock("svelte", () => ({ getContext: vi.fn(), setContext: vi.fn() }))
	vi.spyOn(svelte, "getContext").mockImplementation(() => ctx)
	vi.spyOn(svelte, "setContext").mockImplementation(
		(_, v) => (ctx = v as ReturnType<typeof getRuntimeFromContext>),
	)
	vi.mock("../../shared/utils.js", () => ({
		inlangSymbol: Symbol(""),
		replaceLanguageInUrl: vi.fn(),
	}))
})

describe("getRuntimeFromContext", () => {
	test("should return undefined if context was never set", async () => {
		expect(getRuntimeFromContext()).toBeUndefined()
	})
})

describe("addRuntimeToContext", () => {
	test("should set the runtime to the context", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()
		expect(r).toBeDefined()
	})

	test("should not change anything if switchLanguage gets called with the already set language", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()
		const iBefore = get(r.i)

		expect(mockedFetch).toHaveBeenCalledTimes(1)
		expect(get(r.language)).toBe("en")

		await r.switchLanguage("en")
		const iAfter = get(r.i)

		expect(mockedFetch).toHaveBeenCalledTimes(1)
		expect(get(r.language)).toBe("en")
		expect(iAfter).toBe(iBefore)
	})

	test("should change the runtime values if switchLanguage gets called", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()
		const iBefore = get(r.i)

		expect(mockedFetch).toHaveBeenCalledTimes(1)
		expect(get(r.language)).toBe("en")

		await r.switchLanguage("de")
		const iAfter = get(r.i)

		expect(mockedFetch).toHaveBeenCalledTimes(2)
		expect(get(r.language)).toBe("de")
		expect(iAfter).not.toBe(iBefore)
	})

	test("should not refetch resource if it is already present", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()

		expect(mockedFetch).toHaveBeenCalledTimes(1)

		await r.loadResource("de")
		expect(mockedFetch).toHaveBeenCalledTimes(2)

		await r.switchLanguage("de")

		expect(mockedFetch).toHaveBeenCalledTimes(2)
	})

	test("route function should return the same path", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()

		expect(r.route("/path/to/page")).toBe("/path/to/page")
	})
})

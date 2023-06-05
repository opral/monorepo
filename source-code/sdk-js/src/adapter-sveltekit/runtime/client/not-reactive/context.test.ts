import { test, describe, expect, vi, beforeEach } from "vitest"
import { getRuntimeFromContext, addRuntimeToContext } from "./context.js"
import * as svelte from "svelte"
import * as navigation from "$app/navigation"
import * as sharedUtils from "../../shared/utils.js"
import { SvelteKitClientRuntime, initSvelteKitClientRuntime } from "../runtime.js"

let ctx: ReturnType<typeof getRuntimeFromContext> | undefined
let runtime: SvelteKitClientRuntime

beforeEach(async () => {
	vi.resetAllMocks()

	ctx = undefined

	runtime = await initSvelteKitClientRuntime({
		fetch: vi.fn().mockReturnValue(Promise.resolve({})),
		language: "en",
		languages: ["en", "de"],
		referenceLanguage: "en",
	})

	vi.mock("$app/navigation", () => ({ goto: vi.fn() }))
	vi.mock("$app/stores", () => ({ page: vi.fn() }))
	vi.mock('$app/paths', () => ({ base: '' }))
	vi.mock("svelte/store", () => ({ get: <V>(value: V) => value }))
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

	test("should make a page navigation if switchLanguage gets called", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()

		await r.switchLanguage("de")

		const mockedReplaceLanguageInUrl = vi.mocked(sharedUtils.replaceLanguageInUrl)
		expect(mockedReplaceLanguageInUrl).toHaveBeenCalledOnce()
		expect(mockedReplaceLanguageInUrl).toHaveBeenCalledWith(undefined, "de")

		const mockedGoto = vi.mocked(navigation.goto)
		expect(mockedGoto).toHaveBeenCalledOnce()
		expect(mockedGoto).toHaveBeenCalledWith(undefined, { invalidateAll: true })
	})

	test("should not make a page navigation if switchLanguage gets called with the already set language", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()

		await r.switchLanguage("en")

		const mockedGoto = vi.mocked(navigation.goto)
		expect(mockedGoto).not.toHaveBeenCalled()
	})

	test("route function should return a path with the current language as prefix", async () => {
		expect(addRuntimeToContext(runtime)).toBeUndefined()

		const r = getRuntimeFromContext()

		expect(r.route("/path/to/page")).toBe("/en/path/to/page")
	})
})

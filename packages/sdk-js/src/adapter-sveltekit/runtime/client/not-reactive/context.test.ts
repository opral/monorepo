import { test, describe, expect, vi, beforeEach } from "vitest"
import { getRuntimeFromContext, addRuntimeToContext } from "./context.js"
import * as svelte from "svelte"
import * as navigation from "$app/navigation"
import * as sharedUtils from "../../shared/utils.js"
import { type SvelteKitClientRuntime, initSvelteKitClientRuntime } from "../runtime.js"
import type { RelativeUrl } from "../../../../types.js"

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
	vi.mock("$app/paths", () => ({ base: "" }))
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
	beforeEach(() => addRuntimeToContext(runtime))

	test("should set the runtime to the context", async () => {
		const r = getRuntimeFromContext()
		expect(r).toBeDefined()
	})

	test("should make a page navigation if switchLanguage gets called", async () => {
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
		const r = getRuntimeFromContext()

		await r.switchLanguage("en")

		const mockedGoto = vi.mocked(navigation.goto)
		expect(mockedGoto).not.toHaveBeenCalled()
	})
})

describe("route", () => {
	beforeEach(() => addRuntimeToContext(runtime))

	test("should return a path with the current language as prefix", async () => {
		const r = getRuntimeFromContext()

		expect(r.route("/path/to/page")).toBe("/en/path/to/page")
	})

	test("should not alter absolute urls", async () => {
		const r = getRuntimeFromContext()

		expect(r.route("path/to/page" as RelativeUrl)).toBe("path/to/page")
	})

	test("should remove trailing slashes", async () => {
		const r = getRuntimeFromContext()

		expect(r.route("/")).toBe("/en")
	})
})

import { test, describe, expect } from "vitest"
import { initSvelteKitClientRuntime } from "./runtime.js"
import { rest } from "msw"
import { setupServer } from "msw/node"
import { createMessage, createResource } from "@inlang/core/test"

const PREFIX = "https://www.inlang.com"

const patchedFetch = (...args: Parameters<typeof fetch>) => fetch(PREFIX + args[0], args[1])

describe("initSvelteKitClientRuntime", () => {
	test("should initialize a runtime instance", async () => {
		const runtime = await initSvelteKitClientRuntime({
			fetch,
			referenceLanguage: "en",
			languages: ["en"],
			language: undefined,
		})
		expect(runtime.language).toBeUndefined()
		expect(runtime.i("hello")).toBe("")
	})

	test("should initialize a runtime instance and fetch the resource for the set language", async () => {
		const server = setupServer(
			rest.get(`${PREFIX}/inlang/en.json`, (_, res, ctx) =>
				res(
					ctx.status(200),
					ctx.body(JSON.stringify(createResource("en", createMessage("hello", "World!")))),
				),
			),
		)

		server.listen()

		const runtime = await initSvelteKitClientRuntime({
			fetch: patchedFetch,
			referenceLanguage: "en",
			languages: ["en"],
			language: "en",
		})
		server.close()

		expect(runtime.language).toBe("en")
		expect(runtime.i("hello")).toBe("World!")
	})
})

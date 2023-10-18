import { describe, it, expect, vi, beforeEach } from "vitest"
import { getSvelteKitVersion } from "./getSvelteKitVersion.js"

vi.mock("@sveltejs/kit")
vi.mock("node:fs/promises")
vi.mock("vitefu")

const svelteKit = (await import("@sveltejs/kit")) as { VERSION?: string }
const fs = await import("node:fs/promises")
const vitefu = await import("vitefu")

beforeEach(() => {
	vi.resetAllMocks()
})

describe("should return the version", () => {
	it("if `@sveltejs/kit` has a `VERSION` export", async () => {
		svelteKit.VERSION = "1.2.3"

		const version = await getSvelteKitVersion()
		expect(version).toBe("1.2.3")
	})

	it("if `package.json` is found", async () => {
		delete svelteKit.VERSION
		vitefu.findDepPkgJsonPath = async () => "path/to/package.json"
		fs.readFile = (async () => '{ "version": "2.3.4" }') as unknown as typeof fs.readFile

		const version = await getSvelteKitVersion()
		expect(version).toBe("2.3.4")
	})
})

describe("should not throw", () => {
	it("if `findDepPkgJsonPath` throws an error", async () => {
		delete svelteKit.VERSION
		vitefu.findDepPkgJsonPath = async () => {
			throw new Error()
		}
		fs.readFile = (async () => "{}") as unknown as typeof fs.readFile

		const version = await getSvelteKitVersion()
		expect(version).toBe(undefined)
	})

	it("if `findDepPkgJsonPath` does not find the path", async () => {
		delete svelteKit.VERSION
		vitefu.findDepPkgJsonPath = async () => undefined

		const version = await getSvelteKitVersion()
		expect(version).toBe(undefined)
	})

	it("if `package.json` cannot be read", async () => {
		delete svelteKit.VERSION
		vitefu.findDepPkgJsonPath = async () => "path/to/package.json"
		fs.readFile = async () => {
			throw new Error()
		}

		const version = await getSvelteKitVersion()
		expect(version).toBe(undefined)
	})

	it("if `package.json` is invalid JSON", async () => {
		delete svelteKit.VERSION
		vitefu.findDepPkgJsonPath = async () => "path/to/package.json"
		fs.readFile = (async () => "{oops}") as unknown as typeof fs.readFile

		const version = await getSvelteKitVersion()
		expect(version).toBe(undefined)
	})

	it("if `@sveltejs/kit` has no `VERSION` export and `package.json` is not found", async () => {
		delete svelteKit.VERSION
		fs.readFile = (async () => "{}") as unknown as typeof fs.readFile

		const version = await getSvelteKitVersion()
		expect(version).toBe(undefined)
	})
})

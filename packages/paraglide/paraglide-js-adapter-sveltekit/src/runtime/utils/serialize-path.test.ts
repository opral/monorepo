import { describe, it, expect } from "vitest"
import { serializeRoute } from "./serialize-path"

describe("serializePath", () => {
	it("correctly serializes the path (with base path)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			isDataRequest: false,
		})

		expect(path).toBe("/base/foo/bar")
	})

	it("correctly serializes the path (without base path)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/",
			isDataRequest: false,
		})

		expect(path).toBe("/foo/bar")
	})

	it("correctly serializes the path (with data suffix)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/",
			isDataRequest: true,
		})

		expect(path).toBe("/foo/bar/__data.json")
	})

	it("correctly serializes the path (with data suffix and base)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			isDataRequest: true,
		})

		expect(path).toBe("/base/foo/bar/__data.json")
	})
})

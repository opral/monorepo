import { describe, it, expect } from "vitest"
import { resolvePath } from "./resolvePath"

describe("resolvePath", () => {
	it("resolves a static path", () => {
		const resolvedPath = resolvePath("/foo", {})
		expect(resolvedPath).toBe("/foo")
	})

	it("resolves a path with a param", () => {
		const resolvedPath = resolvePath("/foo/[id]", { id: "bar" })
		expect(resolvedPath).toBe("/foo/bar")
	})

	it("resolves a path with multiple params", () => {
		const resolvedPath = resolvePath("/foo/[id]/[slug]", { id: "bar", slug: "baz" })
		expect(resolvedPath).toBe("/foo/bar/baz")
	})
})

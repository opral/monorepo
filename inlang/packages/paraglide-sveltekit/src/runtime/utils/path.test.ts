import { describe, it, expect } from "vitest"
import * as path from "./path"

describe("path.normalize", () => {
	it("adds a leading slash", () => {
		expect(path.normalize("foo")).toBe("/foo")
	})

	it("removes a trailing slash", () => {
		expect(path.normalize("foo/")).toBe("/foo")
	})

	it("can deal with empty segments", () => {
		expect(path.normalize("foo//bar")).toBe("/foo/bar")
	})

	it("can deal with an empty input", () => {
		expect(path.normalize("")).toBe("/")
	})
})

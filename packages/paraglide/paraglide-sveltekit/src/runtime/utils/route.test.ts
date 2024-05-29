import { describe, it, expect } from "vitest"
import { parseRoute, serializeRoute } from "./route"

describe("parsePath", () => {
	it("correctly identifies the segments (with base path)", () => {
		const [path] = parseRoute("/base/foo/bar", "/base")
		expect(path).toBe("/foo/bar")
	})

	it("correctly identifies the segments (without base path)", () => {
		const [path] = parseRoute("/foo/bar", "")
		expect(path).toBe("/foo/bar")
	})

	it("deals with root inputs", () => {
		const [path] = parseRoute("/", "")
		expect(path).toBe("/")
	})

	it("deals with an input that is just the base inputs", () => {
		const [path] = parseRoute("/base", "/base")
		expect(path).toBe("/")
	})

	it("removes data-request suffixes as data requests", () => {
		const [path, dataSuffix] = parseRoute("/foo/bar/__data.json", "")
		expect(dataSuffix).toBe("/__data.json")
		expect(path).toBe("/foo/bar")
	})

	it("identifies data-requests as html data requests", () => {
		const [path, dataSuffix] = parseRoute("/foo/bar/.html__data.json", "")
		expect(dataSuffix).toBe("/.html__data.json")
		expect(path).toBe("/foo/bar")
	})

	it("preserves trailing slash", () => {
		const [path] = parseRoute("/base/foo/bar/", "/base")
		expect(path).toBe("/foo/bar/")
	})

	it("decodes encoded url segments", () => {
		const [path] = parseRoute("/%20", "")
		expect(path).toBe("/ ")
	})
})

describe("serializeRoute", () => {
	it("correctly serializes the path (with base path)", () => {
		const path = serializeRoute("/foo/bar", "/base", undefined)
		expect(path).toBe("/base/foo/bar")
	})

	it("correctly serializes the path (without base path)", () => {
		const path = serializeRoute("/foo/bar", "", undefined)
		expect(path).toBe("/foo/bar")
	})

	it("correctly serializes the path (with data suffix)", () => {
		const path = serializeRoute("/foo/bar", "", "/__data.json")
		expect(path).toBe("/foo/bar/__data.json")
	})

	it("correctly serializes the path (with data suffix and base)", () => {
		const path = serializeRoute("/foo/bar", "/base", "/__data.json")
		expect(path).toBe("/base/foo/bar/__data.json")
	})

	it("preserves the trailing slash", () => {
		const path = serializeRoute("/foo/bar/", "/base", undefined)
		expect(path).toBe("/base/foo/bar/")
	})
})

import { describe, it, expect } from "vitest"
import { format } from "./format"
import { format as nativeFormat, parse } from "node:url"

describe.skipIf(() => {
	process.env.NODE_ENV === "production"
})("format", () => {
	it("should format the url", () => {
		const url = parse("https://example.com/foo/bar")
		expect(format(url)).toBe(nativeFormat(url))
	})
})

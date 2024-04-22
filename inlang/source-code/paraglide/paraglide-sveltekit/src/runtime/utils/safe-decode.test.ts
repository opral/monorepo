import { describe, expect, it } from "vitest"
import { safeDecode } from "./safe-decode.js"

describe("safeDecode", () => {
	it("should decode a url", () => {
		expect(safeDecode("/%20")).toBe("/ ")
	})
	it("should return the input if it's not a url", () => {
		expect(safeDecode("not a url")).toBe("not a url")
	})
})

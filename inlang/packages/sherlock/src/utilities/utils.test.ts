import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { handleError, escapeHtml } from "./utils.js"

// Mocks
vi.mock("../services/telemetry/implementation.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("vscode", () => ({
	version: "1.0.0",
	window: {
		createOutputChannel: vi.fn(),
	},
}))

vi.mock("../../package.json", () => ({
	version: "1.2.3",
}))

describe("handleError", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should call console.error with the error", () => {
		const error = new Error("test error")
		handleError(error)
		expect(console.error).toHaveBeenCalledWith(error)
	})
})

describe("escapeHtml", () => {
	it.each([
		["<div>", "&lt;div&gt;"],
		['"double"', "&quot;double&quot;"],
		["'single'", "&#039;single&#039;"],
		["&", "&amp;"],
		['<>&"', "&lt;&gt;&amp;&quot;"],
	])("should escape %s to %s", (input, expected) => {
		expect(escapeHtml(input)).toBe(expected)
	})
})

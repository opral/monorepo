import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { telemetryCapture, handleError, escapeHtml } from "./utils.js"
import { telemetry } from "../services/telemetry/implementation.js"

// Mocks
vi.mock("../services/telemetry/implementation.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("vscode", () => ({
	version: "1.0.0",
}))

vi.mock("../../package.json", () => ({
	version: "1.2.3",
}))

describe("telemetryCapture", () => {
	it("should call telemetry.capture with correct parameters", () => {
		const event = "testEvent"
		const properties = { key: "value" }
		// @ts-expect-error
		telemetryCapture(event, properties)
		expect(telemetry.capture).toHaveBeenCalledWith({
			event,
			properties: {
				vscode_version: "1.0.0",
				version: "1.2.3",
				...properties,
			},
		})
	})
})

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

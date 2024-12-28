import { describe, it, expect, vi } from "vitest"
import { getPatternFromString, getStringFromPattern } from "./query.js"

vi.mock("vscode", () => ({
	window: {
		showInformationMessage: vi.fn(),
		createStatusBarItem: vi.fn().mockReturnValue({
			show: vi.fn(),
			text: "",
			tooltip: "",
			command: "",
			alignment: 1,
		}),
	},
	StatusBarAlignment: {
		Left: 1,
	},
}))

describe("getStringFromPattern", () => {
	it("should handle Text elements", () => {
		const result = getStringFromPattern({
			pattern: [
				{ type: "text", value: "Hello " },
				{ type: "text", value: "World" },
			],
			locale: "en-US",
			messageId: "1",
		})
		expect(result).toBe("Hello World")
	})

	it("should handle VariableReference elements", () => {
		const result = getStringFromPattern({
			pattern: [
				{
					type: "expression",
					arg: { type: "variable-reference", name: "name" },
				},
			],
			locale: "en-US",
			messageId: "2",
		})
		expect(result).toBe("{name}")
	})

	it("should handle mixed elements", () => {
		const result = getStringFromPattern({
			pattern: [
				{ type: "text", value: "Hello " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "name" },
				},
			],
			locale: "en-US",
			messageId: "3",
		})
		expect(result).toBe("Hello {name}")
	})
})

describe("getPatternFromString", () => {
	it("should convert string to pattern with Text elements", () => {
		const result = getPatternFromString({ string: "Hello World" })
		expect(result).toEqual([{ type: "text", value: "Hello World" }])
	})

	it("should convert string to pattern with VariableReference elements", () => {
		const result = getPatternFromString({ string: "{name}" })
		expect(result).toEqual([
			{ type: "expression", arg: { type: "variable-reference", name: "name" } },
		])
	})

	it("should convert string to mixed pattern", () => {
		const result = getPatternFromString({ string: "Hello {name}" })
		expect(result).toEqual([
			{ type: "text", value: "Hello " },
			{ type: "expression", arg: { type: "variable-reference", name: "name" } },
		])
	})

	it("should handle complex patterns correctly", () => {
		const result = getPatternFromString({
			string: "Hello {name}, welcome to {place}",
		})
		expect(result).toEqual([
			{ type: "text", value: "Hello " },
			{ type: "expression", arg: { type: "variable-reference", name: "name" } },
			{ type: "text", value: ", welcome to " },
			{
				type: "expression",
				arg: { type: "variable-reference", name: "place" },
			},
		])
	})
})

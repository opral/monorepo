import { describe, it, expect } from "vitest"
import type * as AST from "@inlang/sdk/v2"
import { getInputTypeConstraints } from "./types.js"
import type { Registry } from "./registry/registry.js"

describe("getInputTypeConstraints", () => {
	it("should return empty object if there are no inputs", () => {
		const message: AST.Message = {
			declarations: [],
			selectors: [],
			variants: [],
			locale: "en",
		}

		expect(getInputTypeConstraints(message, {})).toEqual({})
	})

	it("should return an object with no type-constraints if there are no expressions", () => {
		const message: AST.Message = {
			declarations: [
				{
					type: "input",
					name: "input1",
					value: { type: "expression", arg: { name: "input1", type: "variable" } },
				},
			],
			selectors: [],
			variants: [],
			locale: "en",
		}

		expect(getInputTypeConstraints(message, {})).toEqual({
			input1: new Set(),
		})
	})

	it("should type-constraints if a function annotation is used on the input", () => {
		const message: AST.Message = {
			declarations: [
				{
					type: "input",
					name: "input1",
					value: {
						type: "expression",
						arg: {
							name: "input1",
							type: "variable",
						},
						annotation: {
							type: "function",
							options: [],
							name: "plural",
						},
					},
				},
			],
			selectors: [],
			variants: [],
			locale: "en",
		}

		const registry: Registry = {
			plural: {
				signature: {
					input: "number",
					options: {},
				},
			},
		}

		expect(getInputTypeConstraints(message, registry)).toEqual({
			input1: new Set(["number"]),
		})
	})
})

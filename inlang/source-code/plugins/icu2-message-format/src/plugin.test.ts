import { describe, it, expect } from "vitest"
import { parseICUMessage } from "./plugin"
import { Translation } from "@inlang/sdk"

describe("parseICUMessage", () => {
	describe("simple message", () => {
		it("should parse a simple text-only message", () => {
			const message = parseICUMessage("en", "Hello World")
			const expected: Translation = {
				declarations: [],
				selectors: [],
				languageTag: "en",
				variants: [
					{
						match: [],
						pattern: [
							{
								type: "text",
								value: "Hello World",
							},
						],
					},
				],
			}
			expect(message).toEqual(expected)
		})
	})

	describe("select message", () => {
		it("parses a message with an annotation in the input and the selector", () => {
			// MUST NOT INCLUDE WHITESPACE BEFORE OR AFTER THE MESSAGE
			const source = `.input {$var :number maximumFractionDigits=0}
.match {$var :number maximumFractionDigits=2}
0 {{The selector can apply a different annotation to {$var} for the purposes of selection}}
* {{A placeholder in a pattern can apply a different annotation to {$var :number maximumFractionDigits=3}}}`
			const message = parseICUMessage("de", source)

			const expected: Translation = {
				languageTag: "de",
				declarations: [
					{
						type: "input",
						name: "var",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "var",
							},

							annotation: {
								type: "function",
								name: "number",
								options: [
									{
										name: "maximumFractionDigits",
										value: {
											type: "literal",
											value: "0",
										},
									},
								],
							},
						},
					},
				],
				selectors: [
					{
						type: "expression",
						arg: {
							type: "variable",
							name: "var",
						},
						annotation: {
							type: "function",
							name: "number",
							options: [
								{
									name: "maximumFractionDigits",
									value: {
										type: "literal",
										value: "2",
									},
								},
							],
						},
					},
				],
				variants: [
					{
						match: ["0"],
						pattern: [
							{
								type: "text",
								value: "The selector can apply a different annotation to ",
							},
							{
								type: "expression",
								arg: {
									type: "variable",
									name: "var",
								},
							},
							{
								type: "text",
								value: " for the purposes of selection",
							},
						],
					},
					{
						match: ["*"],
						pattern: [
							{
								type: "text",
								value: "A placeholder in a pattern can apply a different annotation to ",
							},
							{
								type: "expression",
								arg: {
									type: "variable",
									name: "var",
								},
								annotation: {
									type: "function",
									name: "number",
									options: [
										{
											name: "maximumFractionDigits",
											value: {
												type: "literal",
												value: "3",
											},
										},
									],
								},
							},
						],
					},
				],
			}

			expect(message).toEqual(expected)
		})
	})
})

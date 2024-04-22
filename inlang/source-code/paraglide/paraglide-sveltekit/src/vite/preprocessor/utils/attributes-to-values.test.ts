import { describe, it, expect } from "vitest"
import { attrubuteValuesToJSValue } from "./attributes-to-values"
import type { AttributeValue } from "../types"

describe("attributesToValues", () => {
	it("stringifies a single text value", () => {
		const originalCode = "hello"

		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 5,
				type: "Text",
				raw: "hello",
				data: "hello",
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("`hello`")
	})

	it("stringifies a single mustache tag", () => {
		const originalCode = "{hello}"
		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 7,
				type: "MustacheTag",
				expression: {
					start: 1,
					end: 6,
				},
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("hello")
	})

	it("stringifies an interweaved text and mustache tag", () => {
		const originalCode = "hello {world}"
		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 5,
				type: "Text",
				raw: "hello ",
				data: "hello ",
			},
			{
				start: 6,
				end: 13,
				type: "MustacheTag",
				expression: {
					start: 7,
					end: 12,
				},
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("`hello ${world}`")
	})

	it("escapes backticks in text", () => {
		const originalCode = "hello `world`"

		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 13,
				type: "Text",
				raw: "hello `world`",
				data: "hello `world`",
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("`hello \\`world\\``")
	})

	it("escapes ${ in text", () => {
		const originalCode = "hello ${world"

		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 13,
				type: "Text",
				raw: "hello ${world",
				data: "hello ${world",
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("`hello \\${world`")
	})

	it("doesn't escape $ in text", () => {
		const originalCode = "hello $world"

		const attributeValues: AttributeValue[] = [
			{
				start: 0,
				end: 12,
				type: "Text",
				raw: "hello $world",
				data: "hello $world",
			},
		]

		const result = attrubuteValuesToJSValue(attributeValues, originalCode)
		expect(result).toBe("`hello $world`")
	})
})

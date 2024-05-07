import { describe, expect, it } from "vitest"
import { getColor, getPalette } from "./overridePrimitiveColors.js"
import chroma from "chroma-js"

describe("getColors", () => {
	//color of violet
	const refColor = chroma("#EE82EE")

	it("should pickup css colors", () => {
		const color = getColor("violet")
		expect(color).toStrictEqual(refColor)
	})
	it("should pickup hex colors", () => {
		const color = getColor("#EE82EE")
		expect(color).toStrictEqual(refColor)
	})
	it("should pickup rgb colors", () => {
		const color = getColor("rgb(238, 130, 238)")
		expect(color).toStrictEqual(refColor)
	})
	it("should pickup rgba colors", () => {
		const color = getColor("rgba(238, 130, 238, 1)")
		expect(color).toStrictEqual(refColor)
	})
})

describe("getPalette", () => {
	//reference color (green) with good white on green contrast ratio
	const refColor = "#16a34a"

	it("should create a palette with 50, 100-900 and 950 shades", () => {
		const palette = getPalette(refColor)
		expect(Object.keys(palette).length).toBe(11)
		expect(palette[50]).toBe("#f4f9f5")
		expect(palette[600]).toBe(refColor)
		expect(palette[950]).toBe("#083a1a")
	})
})

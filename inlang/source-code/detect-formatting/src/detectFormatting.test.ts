import { expect, it, describe } from "vitest"
import { detectFormatting } from "./detectFormatting.js"

describe("defaults", () => {
	it("should return formatting values", () => {
		expect(detectFormatting().values.endWithNewLine).toBeTruthy()
		expect(detectFormatting().values.nestedKeys).toBeFalsy()
		expect(detectFormatting().values.spacing).toBe(2)
	})
	it("should serialize a file according to defaults"),
		() => {
			const json = {
				test: "a",
			}
			const serialize = detectFormatting().serialize
			const newFile = serialize(json)

			expect(newFile.endsWith("\n")).toBeTruthy()
			expect(/^{\n {2}[^ ]+.*$/m.test(newFile)).toBeTruthy()
		}
})

describe("detect formatting values", () => {
	it("should detect ends with new line", () => {
		// @prettier-ignore
		const withNewLine = `{
	"test": "test"
}
`

		// @prettier-ignore
		const withoutNewLine = `{
	"test": "test"
}`
		expect(detectFormatting(withNewLine).values.endWithNewLine).toBeTruthy()
		expect(detectFormatting(withoutNewLine).values.endWithNewLine).toBeFalsy()
	})

	it("should detect spacing", () => {
		// @prettier-ignore
		const with4Spaces = `{
    "test": "test"
}`

		// @prettier-ignore
		const withTabs = `{
	"test": "test"
}`

		expect(detectFormatting(with4Spaces).values.spacing).toBe(4)
		expect(detectFormatting(withTabs).values.spacing).toBe("\t")
	})

	it("should correctly detect the key nesting", () => {
		const withNesting = JSON.stringify(
			{
				test: {
					test: "test",
				},
			},
			undefined,
			2,
		)

		const withoutNesting = JSON.stringify(
			{
				"test.test": "test",
			},
			undefined,
			4,
		)

		expect(detectFormatting(withNesting).values.nestedKeys).toBeTruthy()
		expect(detectFormatting(withoutNesting).values.nestedKeys).toBeFalsy()
	})
})

describe("return serializer that applies correct formatting", () => {
	it("should correctly serialize", () => {
		// @prettier-ignore
		const withNewLineAnd4Spaces = `{
    "test": "test"
}
`
		// @prettier-ignore
		const withoutNewLineAndTabs = `{
	"test": "test"
}`
		const serialize1 = detectFormatting(withNewLineAnd4Spaces).serialize
		const values1 = detectFormatting(withNewLineAnd4Spaces).values

		const serialize2 = detectFormatting(withoutNewLineAndTabs).serialize
		const values2 = detectFormatting(withoutNewLineAndTabs).values

		const json = {
			test: "test",
		}

		const newFile1 = serialize1(json)
		expect(values1.spacing).toBe(4)
		expect(values1.endWithNewLine).toBeTruthy()
		expect(newFile1).toBe(withNewLineAnd4Spaces)

		const newFile2 = serialize2(json)
		expect(values2.spacing).toBe("\t")
		expect(values2.endWithNewLine).toBeFalsy()
		expect(newFile2).toBe(withoutNewLineAndTabs)
	})
})

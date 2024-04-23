import { describe, it, expect } from "vitest"
// import { parseLixUri, parseOrigin } from "./helpers.js"
import { stringifyMessage } from "./helper.js"
import type { Message } from "@inlang/message"

describe("stringifyMessage", () => {
	it("should return a sorted message ", () => {
		const unsortedMessageRaw: Message = {
			alias: {},
			selectors: [],
			id: "footer_categories_apps",
			variants: [
				{ languageTag: "a", match: ["*", "1"], pattern: [{ type: "Text", value: "2" }] },
				{ languageTag: "a", match: ["*", "*"], pattern: [{ type: "Text", value: "1" }] },
				{
					languageTag: "a",
					match: ["1", "*"],
					pattern: [
						{ type: "Text", value: "2" },
						{ type: "Text", value: "2" },
					],
				},
				{ languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
				{ languageTag: "a", match: ["1", "1"], pattern: [{ type: "Text", value: "2" }] },
				{ languageTag: "c", match: [], pattern: [{ value: "5", type: "Text" }] },
				{ match: [], languageTag: "d", pattern: [{ type: "Text", value: "6" }] },
				{ languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
				{ languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
				{ languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
			],
		}
		const sortedMessageRaw: Message = {
			alias: {},
			id: "footer_categories_apps",
			selectors: [],
			variants: [
				{ languageTag: "a", match: ["*", "*"], pattern: [{ type: "Text", value: "1" }] },
				{ languageTag: "a", match: ["*", "1"], pattern: [{ type: "Text", value: "2" }] },
				{
					languageTag: "a",
					match: ["1", "*"],
					pattern: [
						{ type: "Text", value: "2" },
						{ type: "Text", value: "2" },
					],
				},
				{ languageTag: "a", match: ["1", "1"], pattern: [{ type: "Text", value: "2" }] },
				{ languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
				{ languageTag: "c", match: [], pattern: [{ type: "Text", value: "5" }] },
				{ languageTag: "d", match: [], pattern: [{ type: "Text", value: "6" }] },
				{ languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
				{ languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
				{ languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
			],
		}

		const jsonStrigifyResult = JSON.stringify(sortedMessageRaw, undefined, 4)
		const result = stringifyMessage(unsortedMessageRaw)
		expect(jsonStrigifyResult).toBe(result)
	})

	it("should return a sorted message (compated to json stringify)", () => {
		const unordererdMessageRaw: Message = {
			id: "footer_categories_apps",
			alias: {},
			selectors: [],
			variants: [
				{ languageTag: "g", match: [], pattern: [{ type: "Text", value: "Apps" }] },
				{ languageTag: "a", match: ["*", "*"], pattern: [{ type: "Text", value: "Apps" }] },
				{ languageTag: "a", match: ["*", "1"], pattern: [{ type: "Text", value: "Apps" }] },
				{ match: [], languageTag: "a", pattern: [{ type: "Text", value: "Apps" }] },
				{ languageTag: "c", match: [], pattern: [{ type: "Text", value: "Applications" }] },
				{ languageTag: "e", match: [], pattern: [{ type: "Text", value: "Applicazioni" }] },
				{ languageTag: "d", match: [], pattern: [{ type: "Text", value: "Aplicativos" }] },
				{ languageTag: "f", match: [], pattern: [{ type: "Text", value: "Aplikácie" }] },
				{ languageTag: "b", match: [], pattern: [{ type: "Text", value: "应用" }] },
			],
		}

		const messageObject: Message = unordererdMessageRaw //JSON.parse(unordererdMessageRaw) as Message

		const jsonStrigifyResult = JSON.stringify(messageObject, undefined, 4)
		const result = stringifyMessage(messageObject)
		expect(jsonStrigifyResult).not.toBe(result)
	})
})

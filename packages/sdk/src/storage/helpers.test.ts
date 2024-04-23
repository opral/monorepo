import { describe, it, expect } from "vitest"
// import { parseLixUri, parseOrigin } from "./helpers.js"
import { stringifyMessage } from "./helper.js"
import type { Message } from "@inlang/message"

describe("stringifyMessage", () => {
	it("should return a sorted message ", () => {
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
		expect(jsonStrigifyResult).toBe(result)
	})
})

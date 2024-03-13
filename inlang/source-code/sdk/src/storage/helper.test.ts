import { describe, it, expect } from "vitest"
import { stringifyMessage } from "./helper.js"
import type { Message } from "@inlang/message"

describe("stringifyMessage", () => {
	it("does not modify the input", () => {
		const message: Message = {
			id: "m1",
			alias: {},
			selectors: [],
			variants: [
				{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "Hello World!" }] },
				{ languageTag: "de", match: [], pattern: [{ type: "Text", value: "Hallo Welt!" }] },
			],
		}
		const copy = structuredClone(message)
		stringifyMessage(message)
		expect(copy).toEqual(message)
	})
})

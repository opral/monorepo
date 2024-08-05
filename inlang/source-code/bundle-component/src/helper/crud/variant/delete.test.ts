import { type MessageNested, createVariant } from "@inlang/sdk2"
import { describe, expect, it } from "vitest"
import deleteVariant from "./delete.js"

describe("deleteVariant", () => {
	it("Should delete variant", () => {
		const messageId = "testId"
		const message: MessageNested = {
			bundleId: "testBundleId",
			id: messageId,
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				createVariant({ messageId, id: "a", match: { count: "*" } }),
				createVariant({ messageId, id: "b", match: { count: "one" } }),
			],
		}

		deleteVariant({ message, variant: message.variants[1]! })

		expect(message.variants.length).toBe(1)
		expect(message.variants[0]!.id).toBe("a")
	})
})

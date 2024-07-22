import { type NestedMessage, createVariant } from "@inlang/sdk-v2"
import { describe, expect, it } from "vitest"
import deleteVariant from "./delete.js"

describe("deleteVariant", () => {
	it("Should delete variant", () => {
		const messageId = "testId"
		const message: NestedMessage = {
			bundleId: "testBundleId",
			id: messageId,
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				createVariant({ messageId, id: "a", match: ["*"] }),
				createVariant({ messageId, id: "b", match: ["one"] }),
			],
		}

		deleteVariant({ message, variant: message.variants[1]! })

		expect(message.variants.length).toBe(1)
		expect(message.variants[0]!.id).toBe("a")
	})
})

import { createMessage, createMessageBundle } from "@inlang/sdk/v2"
import { describe, expect, it } from "vitest"
import upsertVariant from "./upsert.js"

describe("upsertVariant", () => {
	it("Should update existing variant", () => {
		const bundle = createMessageBundle({
			id: "bundle-id",
			messages: [createMessage({ locale: "en", text: "Hello World", match: ["*"] })],
		})

		expect(bundle.messages).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello World" },
		])

		upsertVariant({
			message: bundle.messages[0]!,
			variant: { match: ["*"], pattern: [{ type: "text", value: "Hello Universe" }] },
		})

		expect(bundle.messages[0]?.variants).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello Universe" },
		])
	})

	it("Should create a new variant", () => {
		const bundle = createMessageBundle({
			id: "bundle-id",
			messages: [createMessage({ locale: "en", text: "Hello World", match: ["*"] })],
		})

		expect(bundle.messages).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello World" },
		])

		upsertVariant({
			message: bundle.messages[0]!,
			variant: { match: ["one"], pattern: [{ type: "text", value: "Hello Universe" }] },
		})

		expect(bundle.messages[0]?.variants).toHaveLength(2)
		expect(bundle.messages[0]?.variants[1]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello Universe" },
		])
	})
})

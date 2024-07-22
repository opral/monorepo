/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createMessage, createBundle, createVariant } from "@inlang/sdk-v2"
import { describe, expect, it } from "vitest"
import upsertVariant from "./upsert.js"

describe("upsertVariant", () => {
	it("Should update existing variant", () => {
		const bundle = createBundle({
			id: "bundle-id",
			messages: [
				{
					bundleId: "bundle-id",
					id: "test_message_id",
					locale: "en",
					declarations: [],
					selectors: [],
					variants: [
						createVariant({
							messageId: "testId",
							id: "test_upsertVariant_id",
							match: ["*"],
							text: "Hello World",
						}),
					],
				},
			],
		})

		expect(bundle.messages).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello World" },
		])

		upsertVariant({
			message: bundle.messages[0]!,
			variant: {
				messageId: bundle.messages[0]!.id,
				id: "test_upsertVariant_id",
				match: ["*"],
				pattern: [{ type: "text", value: "Hello Universe" }],
			},
		})

		expect(bundle.messages[0]?.variants).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello Universe" },
		])
	})

	it("Should create a new variant", () => {
		const bundle = createBundle({
			id: "bundle-id",
			messages: [
				createMessage({ bundleId: "bundle-id", locale: "en", text: "Hello World", match: ["*"] }),
			],
		})

		expect(bundle.messages).toHaveLength(1)
		expect(bundle.messages[0]?.variants[0]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello World" },
		])

		upsertVariant({
			message: bundle.messages[0]!,
			variant: {
				messageId: bundle.messages[0]!.id,
				id: "test_upsertVariant_id",
				match: ["one"],
				pattern: [{ type: "text", value: "Hello Universe" }],
			},
		})

		expect(bundle.messages[0]?.variants).toHaveLength(2)
		// it's 0 because it's sorted alphabetically
		expect(bundle.messages[0]?.variants[1]?.pattern).toStrictEqual([
			{ type: "text", value: "Hello Universe" },
		])
	})
})

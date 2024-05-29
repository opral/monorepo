import { describe, it, expect } from "vitest"
import {
	createMessageBundle,
	createMessage,
	toTextElement,
	upsertVariantOfMessage,
} from "./helper.js"
import { MessageBundle } from "./types.js"
import { Value } from "@sinclair/typebox/value"

describe("createMessageBundle", () => {
	it("creates a bundle with no messages", () => {
		const bundle: unknown = createMessageBundle({ id: "no_messages", messages: [] })
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "no_messages",
			alias: {},
			messages: [],
		} satisfies MessageBundle)
	})

	it("creates a bundle with a single text-only message", () => {
		const bundle: unknown = createMessageBundle({
			id: "hello_world",
			messages: [createMessage({ locale: "en", text: "Hello World!" })],
		})
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "hello_world",
			alias: {},
			messages: [
				{
					locale: "en",
					declarations: [],
					selectors: [],
					variants: [
						{
							match: [],
							pattern: [
								{
									type: "text",
									value: "Hello World!",
								},
							],
						},
					],
				},
			],
		} satisfies MessageBundle)
	})

	it("creates a bundle with multiple text-only messages", () => {
		const bundle: unknown = createMessageBundle({
			id: "hello_world_2",
			messages: [
				createMessage({ locale: "en", text: "Hello World!" }),
				createMessage({ locale: "de", text: "Hallo Welt!" }),
			],
		})
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "hello_world_2",
			alias: {},
			messages: [
				{
					locale: "en",
					declarations: [],
					selectors: [],
					variants: [
						{
							match: [],
							pattern: [
								{
									type: "text",
									value: "Hello World!",
								},
							],
						},
					],
				},
				{
					locale: "de",
					declarations: [],
					selectors: [],
					variants: [
						{
							match: [],
							pattern: [
								{
									type: "text",
									value: "Hallo Welt!",
								},
							],
						},
					],
				},
			],
		} satisfies MessageBundle)
	})
})

describe("upsertVariantOfMessage", () => {
	it("adds a new variant to a message", () => {
		const message = createMessage({
			locale: "en",
			text: "You have something in your inbox!",
			match: ["*"],
		})
		const variant = {
			match: ["one"],
			pattern: [toTextElement("You have a new notification!")],
		}
		upsertVariantOfMessage(message, variant)
		expect(message.variants.length).toBe(2)
	})

	it("updates an existing variant in a message", () => {
		const message = createMessage({
			locale: "en",
			text: "You have something in your inbox!",
			match: ["*"],
		})
		const variant = {
			match: ["*"],
			pattern: [toTextElement("New notifications!")],
		}
		upsertVariantOfMessage(message, variant)
		expect(message.variants.length).toBe(1)
		expect(message.variants[0]?.pattern[0]).toEqual({
			type: "text",
			value: "New notifications!",
		})
	})
})

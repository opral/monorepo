import { describe, it, expect } from "vitest"
import { createMessageBundle } from "./createMessageBundle.js"
import { MessageBundle } from "../v2/types.js"
import { Value } from "@sinclair/typebox/value"

describe("createMessageBundle", () => {
	it("creates a bundle with no messages", () => {
		const bundle: unknown = createMessageBundle("no_messages", {})
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "no_messages",
			alias: {},
			messages: [],
		} satisfies MessageBundle)
	})

	it("creates a bundle with a single message", () => {
		const bundle: unknown = createMessageBundle("hello_world", {
			en: "Hello, World!",
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
									value: "Hello, World!",
								},
							],
						},
					],
				},
			],
		} satisfies MessageBundle)
	})

	it("creates a bundle with multiple messages", () => {
		const bundle: unknown = createMessageBundle("hello_world_2", {
			en: "Hello, World!",
			de: "Hallo, Welt!",
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
									value: "Hello, World!",
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
									value: "Hallo, Welt!",
								},
							],
						},
					],
				},
			],
		} satisfies MessageBundle)
	})

	it("creates a bundle with a variable reference", () => {
		const bundle: unknown = createMessageBundle(
			"hello_name",
			{
				en: "Hello, {name}!",
			},
			{ variableReferencePattern: ["{", "}"] }
		)
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "hello_name",
			alias: {},
			messages: [
				{
					locale: "en",
					declarations: [
						{
							type: "input",
							name: "name",
							value: {
								type: "expression",
								arg: {
									type: "variable",
									name: "name",
								},
							},
						},
					],
					selectors: [],
					variants: [
						{
							match: [],
							pattern: [
								{
									type: "text",
									value: "Hello, ",
								},
								{
									type: "expression",
									arg: {
										type: "variable",
										name: "name",
									},
								},
								{
									type: "text",
									value: "!",
								},
							],
						},
					],
				},
			],
		} satisfies MessageBundle)
	})
})

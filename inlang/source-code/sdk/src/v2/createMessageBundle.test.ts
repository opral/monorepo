import { describe, it, expect } from "vitest"
import { createMessageBundle, createMessage } from "./createMessageBundle.js"
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

	it("creates a bundle with a single text message", () => {
		const bundle: unknown = createMessageBundle({
			id: "hello_world",
			messages: [createMessage({ locale: "en", text: "Hello, World!" })],
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

	it("creates a bundle with multiple pattern messages", () => {
		const bundle: unknown = createMessageBundle({
			id: "hello_world_2",
			messages: [
				createMessage({ locale: "en", pattern: "Hello, {name}!" }),
				createMessage({ locale: "de", pattern: "Hallo, {name}!" }),
			],
		})
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toEqual({
			id: "hello_world_2",
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
				{
					locale: "de",
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
									value: "Hallo, ",
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

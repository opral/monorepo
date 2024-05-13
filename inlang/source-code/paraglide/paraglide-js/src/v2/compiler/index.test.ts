import { compileMessage } from "./index.js"
import { describe, expect, test } from "vitest"
import type { Message } from "@inlang/sdk/v2"

describe("v2 - compileMessage", () => {
	test("no inputs, no selectors", () => {
		const message: Message = {
			locale: "en",
			declarations: [],
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [
						{
							type: "text",
							value: "Hello world",
						},
					],
				},
			],
		}

		const compiled = compileMessage({ message, bundleId: "hello_world" })
		expect(compiled.source).toMatchSnapshot()
	})

	test("simple input, no selectors", () => {
		const message: Message = {
			locale: "en",
			declarations: [
				{
					type: "input",
					name: "name",
					value: {
						type: "expression",
						annotation: undefined,
						arg: { type: "variable", name: "name" },
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
							value: "Hello ",
						},
						{
							type: "expression",
							annotation: undefined,
							arg: { type: "variable", name: "name" },
						},
					],
				},
			],
		}

		const compiled = compileMessage({ message, bundleId: "hello_name" })
		expect(compiled.source).toMatchSnapshot()
	})

	test("input with annotation, no selectors", () => {
		const message: Message = {
			locale: "en",
			declarations: [
				{
					type: "input",
					name: "name",
					value: {
						type: "expression",
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
						arg: { type: "variable", name: "name" },
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
							value: "Hello ",
						},
						{
							type: "expression",
							annotation: undefined,
							arg: { type: "variable", name: "name" },
						},
					],
				},
			],
		}

		const compiled = compileMessage({ message, bundleId: "hello_name" })
		expect(compiled.source).toMatchSnapshot()
	})

	test("input with annotation and selectors", () => {
		const message: Message = {
			locale: "en",
			declarations: [
				{
					type: "input",
					name: "name",
					value: {
						type: "expression",
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
						arg: { type: "variable", name: "name" },
					},
				},
			],
			selectors: [
				{
					type: "expression",
					annotation: undefined,
					arg: {
						type: "variable",
						name: "name",
					},
				},
			],
			variants: [
				{
					match: ["*"],
					pattern: [
						{
							type: "text",
							value: "Hello ",
						},
						{
							type: "expression",
							annotation: undefined,
							arg: { type: "variable", name: "name" },
						},
					],
				},
			],
		}

		const compiled = compileMessage({ message, bundleId: "hello_name" })
		expect(compiled.source).toMatchSnapshot()
	})
})

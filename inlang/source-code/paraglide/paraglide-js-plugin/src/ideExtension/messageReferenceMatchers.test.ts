import { describe, expect, it } from "vitest"
import { parse } from "./messageReferenceMatchers.js" // Replace with the actual filename

describe("Paraglide Message Parser", () => {
	it("should match simple m function call", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";
		m.helloWorld();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 3, character: 5 },
					end: { line: 3, character: 17 },
				},
			},
		])
	})

	// it should match minified m function call
	it("should match minified m function call", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";m.helloWorld();m.hello_world();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 2, character: 64 },
					end: { line: 2, character: 76 },
				},
			},
			{
				messageId: "hello_world",
				position: {
					start: { line: 2, character: 79 },
					end: { line: 2, character: 92 },
				},
			},
		])
	})

	it("should match m function call with arguments", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";
		
		m.someFunction({args1: "", args2: ""}, {languageTag: "en"});
		m.some_function({args1: "", args2: ""}, {languageTag: "en"});
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "someFunction",
				position: {
					start: { line: 4, character: 5 },
					end: { line: 4, character: 62 },
				},
			},
			{
				messageId: "some_function",
				position: {
					start: { line: 5, character: 5 },
					end: { line: 5, character: 63 },
				},
			},
		])
	})

	it("should match multiple messages", () => {
		const sourceCode = `
		@inlang/paraglide-js
		
		m.helloWorld();
		m.someFunction({args1: "", args2: ""}, {languageTag: "en"});
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 4, character: 5 },
					end: { line: 4, character: 17 },
				},
			},
			{
				messageId: "someFunction",
				position: {
					start: { line: 5, character: 5 },
					end: { line: 5, character: 62 },
				},
			},
		])
	})

	it("should match message from multiple namespaces", () => {
		const namespaces = ["frontend", "backend", "example", "other", "project-1"]
		for (const namespace of namespaces) {
			const sourceCode = `
		import * as m from "@inlang/paraglide-js/${namespace}/messages";
		m.helloWorld();
		`
			const result = parse(sourceCode)
			expect(result).toEqual([
				{
					messageId: "helloWorld",
					position: {
						start: { line: 3, character: 5 },
						end: { line: 3, character: 17 },
					},
				},
			])
		}
	})

	it("should match message with no namespace", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/messages";
		m.helloWorld();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 3, character: 5 },
					end: { line: 3, character: 17 },
				},
			},
		])
	})

	it("should match mutiple references to @inlang/paraglide-js", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";

		@inlang/paraglide-js
		
		m.helloWorld();
		m.some_function_with_a_long_name({args1: "", args2: ""}, {languageTag: "en"});
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 6, character: 5 },
					end: { line: 6, character: 17 },
				},
			},
			{
				messageId: "some_function_with_a_long_name",
				position: {
					start: { line: 7, character: 5 },
					end: { line: 7, character: 80 },
				},
			},
		])
	})

	it("should match the m function with an object and the arguments a function call", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";
		m.helloWorld({args1: someFunction(), args2: otherFunction(), args3: "some string"});
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 3, character: 5 },
					end: { line: 3, character: 86 },
				},
			},
		])
	})

	// it should match the m function which do have function chaining
	it("should match the m function which do have function chaining", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";
		m.helloWorld().someFunction().someOtherFunction();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([
			{
				messageId: "helloWorld",
				position: {
					start: { line: 3, character: 5 },
					end: { line: 3, character: 17 },
				},
			},
		])
	})

	it("should match if m is defined before the reference to paraglide", () => {
		const sourceCode = `
		m.helloWorld();
		import * as m from "@inlang/paraglide-js/example/messages";
		`
		const result = parse(sourceCode)
		expect(result).toEqual([])
	})

	it("should match if m is defined but no reference to paraglide", () => {
		const sourceCode = `
		m.helloWorld();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([])
	})

	it("should match if m is defined but has a spell error", () => {
		const sourceCode = `
		import * as m from "@inlang/paraglide-js/example/messages";
		xm.helloWorld();
		`
		const result = parse(sourceCode)
		expect(result).toEqual([])
	})

	it("should match no matches", () => {
		const sourceCode = "const x = 42;"
		const result = parse(sourceCode)
		expect(result).toEqual([])
	})

	it("should match invalid syntax", () => {
		const sourceCode = "const x = 42; m.helloWorld("
		const result = parse(sourceCode)
		expect(result).toEqual([])
	})
})

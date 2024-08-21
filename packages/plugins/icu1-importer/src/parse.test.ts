import { describe, it, expect } from "vitest"
import { parse } from "@formatjs/icu-messageformat-parser"
import { generateBranches, NULL_BRANCH, createMessage } from "./parse.js"

describe("generateBranches", () => {
	it("should generate a single branch for a text-only message", () => {
		const ast = parse("Hello World")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(1)
		expect(branches).toEqual([
			{
				match: [],
				pattern: [
					{
						type: "text",
						value: "Hello World",
					},
				],
			},
		])
	})

	it("should generate a single branch for a message with variables but no branching", () => {
		const ast = parse("Hello {name}")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(1)
		expect(branches).toEqual([
			{
				match: [],
				pattern: [
					{
						type: "text",
						value: "Hello ",
					},
					{
						arg: {
							name: "name",
							type: "variable",
						},
						type: "expression",
					},
				],
			},
		])
	})

	it("should generate branches for each select case (single select)", () => {
		const ast = parse("{value, select, first {first} second {second} third {third}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)

		expect(branches.length).toBe(3)
		expect(branches).toEqual([
			{
				pattern: [
					{
						type: "text",
						value: "first",
					},
				],
				match: [["value", undefined, "first"]],
			},
			{
				pattern: [
					{
						type: "text",
						value: "second",
					},
				],
				match: [["value", undefined, "second"]],
			},
			{
				pattern: [
					{
						type: "text",
						value: "third",
					},
				],
				match: [["value", undefined, "third"]],
			},
		])
	})

	it("should not create a selector for other clauses", () => {
		const ast = parse("{value, select, first {first} other {other}}")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(2)

		expect(branches).toEqual([
			{
				pattern: [
					{
						type: "text",
						value: "first",
					},
				],
				match: [["value", undefined, "first"]],
			},
			{
				pattern: [
					{
						type: "text",
						value: "other",
					},
				],
				match: [],
			},
		])
	})

	it("should generate n*m branches with multiple selects on the same level", () => {
		const ast = parse("{value1, select, a {A} b {B} c {C}} - {value2, select, x {X} y {Y}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(6)
		expect(branches).toEqual([
			{
				pattern: [
					{
						type: "text",
						value: "A",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "X",
					},
				],
				match: [
					["value1", undefined, "a"],
					["value2", undefined, "x"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "B",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "X",
					},
				],
				match: [
					["value1", undefined, "b"],
					["value2", undefined, "x"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "C",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "X",
					},
				],
				match: [
					["value1", undefined, "c"],
					["value2", undefined, "x"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "A",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "Y",
					},
				],
				match: [
					["value1", undefined, "a"],
					["value2", undefined, "y"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "B",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "Y",
					},
				],
				match: [
					["value1", undefined, "b"],
					["value2", undefined, "y"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "C",
					},
					{
						type: "text",
						value: " - ",
					},
					{
						type: "text",
						value: "Y",
					},
				],
				match: [
					["value1", undefined, "c"],
					["value2", undefined, "y"],
				],
			},
		])
	})

	it("should generate n+m branches with nested selects", () => {
		const ast = parse("{value1, select, a {A {value2, select, x {X} y {Y}}} b {B}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(3)
		expect(branches).toEqual([
			{
				pattern: [
					{
						type: "text",
						value: "A ",
					},
					{
						type: "text",
						value: "X",
					},
				],
				match: [
					["value1", undefined, "a"],
					["value2", undefined, "x"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "A ",
					},
					{
						type: "text",
						value: "Y",
					},
				],
				match: [
					["value1", undefined, "a"],
					["value2", undefined, "y"],
				],
			},
			{
				pattern: [
					{
						type: "text",
						value: "B",
					},
				],
				match: [["value1", undefined, "b"]],
			},
		])
	})
})

describe("createMessage", () => {
	it("creates a message for a branchless string", () => {
		const message = createMessage({
			messageSource: "Hello World",
			bundleId: "sad_elephant",
			locale: "en",
		})
		expect(message).toEqual({
			bundleId: "sad_elephant",
			declarations: [],
			id: "sad_elephant_en",
			locale: "en",
			selectors: [],
			variants: [
				{
					id: "sad_elephant_en_",
					match: [],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "Hello World",
						},
					],
				},
			],
		})
	})

	it("creates a message with multiple variants", () => {
		const icu1 =
			"It's {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}!"
		const message = createMessage({ messageSource: icu1, bundleId: "sad_elephant", locale: "en" })
		expect(message).toEqual({
			bundleId: "sad_elephant",
			declarations: [
				{
					name: "season",
					type: "input",
					value: {
						arg: {
							name: "season",
							type: "variable",
						},
						type: "expression",
					},
				},
			],
			id: "sad_elephant_en",
			locale: "en",
			selectors: [
				{
					annotation: undefined,
					arg: {
						name: "season",
						type: "variable",
					},
					type: "expression",
				},
			],
			variants: [
				{
					id: "sad_elephant_en_spring",
					match: ["spring"],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "It's ",
						},
						{
							type: "text",
							value: "spring",
						},
						{
							type: "text",
							value: "!",
						},
					],
				},
				{
					id: "sad_elephant_en_summer",
					match: ["summer"],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "It's ",
						},
						{
							type: "text",
							value: "summer",
						},
						{
							type: "text",
							value: "!",
						},
					],
				},
				{
					id: "sad_elephant_en_fall",
					match: ["fall"],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "It's ",
						},
						{
							type: "text",
							value: "fall",
						},
						{
							type: "text",
							value: "!",
						},
					],
				},
				{
					id: "sad_elephant_en_winter",
					match: ["winter"],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "It's ",
						},
						{
							type: "text",
							value: "winter",
						},
						{
							type: "text",
							value: "!",
						},
					],
				},
			],
		})
	})

	it("treats tags as text", () => {
		const message = createMessage({
			messageSource: "<b>Hello</b>",
			bundleId: "sad_elephant",
			locale: "en",
		})
		expect(message).toEqual({
			bundleId: "sad_elephant",
			declarations: [],
			id: "sad_elephant_en",
			locale: "en",
			selectors: [],
			variants: [
				{
					id: "sad_elephant_en_",
					match: [],
					messageId: "sad_elephant_en",
					pattern: [
						{
							type: "text",
							value: "<b>Hello</b>",
						},
					],
				},
			],
		})
	})

	it("handles pounds", () => {
		const message = createMessage({
			messageSource: "You have {likes, plural, one {# like} other {# likes}}",
			bundleId: "sad_elephant",
			locale: "en",
		})

		expect(message).toMatchInlineSnapshot(`
			{
			  "bundleId": "sad_elephant",
			  "declarations": [
			    {
			      "name": "likes",
			      "type": "input",
			      "value": {
			        "arg": {
			          "name": "likes",
			          "type": "variable",
			        },
			        "type": "expression",
			      },
			    },
			  ],
			  "id": "sad_elephant_en",
			  "locale": "en",
			  "selectors": [
			    {
			      "annotation": {
			        "name": "plural",
			        "options": [],
			        "type": "function",
			      },
			      "arg": {
			        "name": "likes",
			        "type": "variable",
			      },
			      "type": "expression",
			    },
			  ],
			  "variants": [
			    {
			      "id": "sad_elephant_en_one",
			      "match": [
			        "one",
			      ],
			      "messageId": "sad_elephant_en",
			      "pattern": [
			        {
			          "type": "text",
			          "value": "You have ",
			        },
			        {
			          "arg": {
			            "name": "likes",
			            "type": "variable",
			          },
			          "type": "expression",
			        },
			        {
			          "type": "text",
			          "value": " like",
			        },
			      ],
			    },
			    {
			      "id": "sad_elephant_en_any",
			      "match": [
			        "*",
			      ],
			      "messageId": "sad_elephant_en",
			      "pattern": [
			        {
			          "type": "text",
			          "value": "You have ",
			        },
			        {
			          "arg": {
			            "name": "likes",
			            "type": "variable",
			          },
			          "type": "expression",
			        },
			        {
			          "type": "text",
			          "value": " likes",
			        },
			      ],
			    },
			  ],
			}
		`)
	})
})

import { describe, it, expect } from "vitest"
import { parse } from "@formatjs/icu-messageformat-parser"
import { generateBranches, NULL_BRANCH } from "./parse.js"

describe("generateBranches", () => {
	it("should generate a single branch for a text-only message", () => {
		const ast = parse("Hello World")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(1)
		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "Hello World",
			      },
			    ],
			    "selectors": [],
			  },
			]
		`)
	})

	it("should generate a single branch for a message with variables but no branching", () => {
		const ast = parse("Hello {name}")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(1)
		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "Hello ",
			      },
			      {
			        "arg": {
			          "name": "name",
			          "type": "variable",
			        },
			        "type": "expression",
			      },
			    ],
			    "selectors": [],
			  },
			]
		`)
	})

	it("should generate branches for each select case (single select)", () => {
		const ast = parse("{value, select, first {first} second {second} third {third}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)

		expect(branches.length).toBe(3)
		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "first",
			      },
			    ],
			    "selectors": [
			      [
			        "value",
			        undefined,
			        "first",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "second",
			      },
			    ],
			    "selectors": [
			      [
			        "value",
			        undefined,
			        "second",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "third",
			      },
			    ],
			    "selectors": [
			      [
			        "value",
			        undefined,
			        "third",
			      ],
			    ],
			  },
			]
		`)
	})

	it("should not create a selector for other clauses", () => {
		const ast = parse("{value, select, first {first} other {other}}")
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(2)

		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "first",
			      },
			    ],
			    "selectors": [
			      [
			        "value",
			        undefined,
			        "first",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "other",
			      },
			    ],
			    "selectors": [],
			  },
			]
		`)
	})

	it("should generate n*m branches with multiple selects on the same level", () => {
		const ast = parse("{value1, select, a {A} b {B} c {C}} - {value2, select, x {X} y {Y}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(6)
		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "A",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "X",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "a",
			      ],
			      [
			        "value2",
			        undefined,
			        "x",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "B",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "X",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "b",
			      ],
			      [
			        "value2",
			        undefined,
			        "x",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "C",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "X",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "c",
			      ],
			      [
			        "value2",
			        undefined,
			        "x",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "A",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "Y",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "a",
			      ],
			      [
			        "value2",
			        undefined,
			        "y",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "B",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "Y",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "b",
			      ],
			      [
			        "value2",
			        undefined,
			        "y",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "C",
			      },
			      {
			        "type": "text",
			        "value": " - ",
			      },
			      {
			        "type": "text",
			        "value": "Y",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "c",
			      ],
			      [
			        "value2",
			        undefined,
			        "y",
			      ],
			    ],
			  },
			]
		`)
	})

	it("should generate n+m branches with nexted selects", () => {
		const ast = parse("{value1, select, a {A {value2, select, x {X} y {Y}}} b {B}}", {
			requiresOtherClause: false,
		})
		const branches = generateBranches(ast, NULL_BRANCH)
		expect(branches.length).toBe(3)
		expect(branches).toMatchInlineSnapshot(`
			[
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "A ",
			      },
			      {
			        "type": "text",
			        "value": "X",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "a",
			      ],
			      [
			        "value2",
			        undefined,
			        "x",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "A ",
			      },
			      {
			        "type": "text",
			        "value": "Y",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "a",
			      ],
			      [
			        "value2",
			        undefined,
			        "y",
			      ],
			    ],
			  },
			  {
			    "pattern": [
			      {
			        "type": "text",
			        "value": "B",
			      },
			    ],
			    "selectors": [
			      [
			        "value1",
			        undefined,
			        "b",
			      ],
			    ],
			  },
			]
		`)
	})
})

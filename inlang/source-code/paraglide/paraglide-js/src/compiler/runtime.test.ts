import { it, expect } from "vitest"
import { m, setCurrentLanguageTag } from "./runtime.js"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import terser from "@rollup/plugin-terser"

import fs from "node:fs/promises"
import { describe } from "node:test"

describe("runtime", () => {
	it("should return the correct message", async () => {
		await setCurrentLanguageTag("en")
		// expect(m.onlyText()).toBe("Only text")
		// expect(m.oneParam({ name: "John" })).toBe("Hello John!")
		// expect(m.multipleParams({ name: "John", count: 5 })).toBe("Hello John! You have 5 messages.")
		// expect(m("onlyText").toBe("Only text")
		// expect(m.oneParam({ name: "John" })).toBe("Hello John!")
		// expect(m.multipleParams({ name: "John", count: 5 })).toBe("Hello John! You have 5 messages.")
	})
})

// describe("tree-shaking", () => {
// 	// removing comments makes the output more predictable and testable
// 	const removeComments = () =>
// 		// @ts-expect-error - rollup types are not up to date
// 		terser({
// 			format: {
// 				comments: false,
// 			},
// 			compress: false,
// 			mangle: false,
// 		})

// 	it("should tree-shake all messages except for the one that is used", async () => {
// 		const bundle = await rollup({
// 			input: "app.js",
// 			plugins: [
// 				removeComments(),
// 				// @ts-expect-error - rollup types are not up to date
// 				virtual({
// 					"messages.js": await fs.readFile(new URL("./messages.js", import.meta.url), "utf-8"),
// 					"runtime.js": await fs.readFile(new URL("./runtime.js", import.meta.url), "utf-8"),
// 					"app.js": `
// 					import * as m from "./messages.js"

// 					console.log(m.onlyText())
// 					`,
// 				}),
// 			],
// 		})
// 		const result = await bundle.generate({ format: "esm" })
// 		expect(result.output[0].code).toBe(
// 			'const onlyText=()=>({en:"Only text",de:"Nur Text"});console.log(onlyText());\n',
// 		)
// 	})

// 	it("should include all messages that are used", async () => {
// 		const bundle = await rollup({
// 			input: "app.js",
// 			plugins: [
// 				removeComments(),
// 				// @ts-expect-error - rollup types are not up to date
// 				virtual({
// 					"messages.js": await fs.readFile(new URL("./messages.js", import.meta.url), "utf-8"),
// 					"runtime.js": await fs.readFile(new URL("./runtime.js", import.meta.url), "utf-8"),
// 					"app.js": `
// 					import * as m from "./messages.js"

// 					console.log(
// 						m.onlyText(),
// 						m.oneParam({ name: "John" }),
// 						m.multipleParams({ name: "John", count: 5 })
// 					)
// 					`,
// 				}),
// 			],
// 		})
// 		const result = await bundle.generate({ format: "esm" })
// 		expect(result.output[0].code).toBe(
// 			'const onlyText=()=>({en:"Only text",de:"Nur Text"});const oneParam=params=>({en:`Hello ${params.name}!`,de:`Hallo ${params.name}!`});const multipleParams=params=>({en:`Hello ${params.name}! You have ${params.count} messages.`,de:`Hallo ${params.name}! Du hast ${params.count} Nachrichten.`});console.log(onlyText(),oneParam({name:"John"}),multipleParams({name:"John",count:5}));\n',
// 		)
// 	})
// })

describe("tree-shaking", () => {
	// removing comments makes the output more predictable and testable
	const removeComments = () =>
		// @ts-expect-error - rollup types are not up to date
		terser({
			format: {
				comments: false,
			},
			compress: false,
			mangle: false,
		})

	it("should tree-shake all messages except for the one that is used", async () => {
		const bundle = await rollup({
			input: "app.js",
			plugins: [
				removeComments(),
				// @ts-expect-error - rollup types are not up to date
				virtual({
					"messages.js": await fs.readFile(new URL("./messages.js", import.meta.url), "utf-8"),
					"runtime.js": await fs.readFile(new URL("./runtime.js", import.meta.url), "utf-8"),
					"app.js": `
					import { m } from "./runtime.js"
					
					console.log(m("onlyText"))
					`,
				}),
			],
		})
		const result = await bundle.generate({ format: "esm" })
		expect(result.output[0].code).toBe(
			'const onlyText=()=>({en:"Only text",de:"Nur Text"});console.log(onlyText());\n',
		)
	})
})

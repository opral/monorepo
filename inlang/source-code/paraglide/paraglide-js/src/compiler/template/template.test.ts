import { it, expect, describe } from "vitest"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import terser from "@rollup/plugin-terser"
import fs from "node:fs/promises"
import { expectType } from "tsd"

import * as m from "./messages.js"

describe("runtime", () => {
	it("should set the source language tag as default language tag", async () => {
		const { languageTag, sourceLanguageTag } = await import("./runtime.js")
		expect(languageTag()).toBe(sourceLanguageTag)
	})

	it("should return the correct message for the set language tag", async () => {
		const { setLanguageTag } = await import("./runtime.js")

		setLanguageTag("en")

		expect(m.onlyText()).toBe("A simple message.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Good morning Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hello Samuel! You have 5 messages.",
		)

		setLanguageTag("de")

		expect(m.onlyText()).toBe("Eine einfache Nachricht.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Guten Morgen Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hallo Samuel! Du hast 5 Nachrichten.",
		)
	})

	it("should return the message id if the message is not translated", async () => {
		const { setLanguageTag } = await import("./runtime.js")

		// @ts-expect-error - fr doesn't exist
		setLanguageTag("fr")

		expect(m.onlyText()).toBe("onlyText")
		expect(m.oneParam({ name: "Samuel" })).toBe("oneParam")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe("multipleParams")
	})
})

describe("types", async () => {
	const runtime = await import("./runtime.js")

	// --------- sourceLanguageTag ---------

	// it should have a narrow type, not a generic string
	expectType<"en">(runtime.sourceLanguageTag)

	// --------- languageTags ----------

	// it should have a narrow type, not a generic string
	expectType<Readonly<Array<"de" | "en">>>(runtime.languageTags)

	// --------- setLanguageTag() ---------

	// @ts-expect-error - should not be possible to set the language tag to a language tags that is not included in languageTags
	runtime.setLanguageTag("fr")

	// it should be possible to set the language tag to a language tag that is included in languageTags
	runtime.setLanguageTag("de")

	// --------- languageTag() ---------

	// it should return the available language tags, not a generic string
	expectType<"en" | "de">(runtime.languageTag())
})

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

	it("should tree-shake messages except for the message that is used and all code that are required for the message to work", async () => {
		const bundle = await rollup({
			input: "app.js",
			plugins: [
				removeComments(),
				// @ts-expect-error - rollup types are not up to date
				virtual({
					"messages.js": await fs.readFile(new URL("./messages.js", import.meta.url), "utf-8"),
					"runtime.js": await fs.readFile(new URL("./runtime.js", import.meta.url), "utf-8"),
					"app.js": `
					import * as m from "./messages.js"

					console.log(m.onlyText())
					`,
				}),
			],
		})
		const compiled = await bundle.generate({ format: "esm" })
		// all required code for the message to be rendered is included like sourceLanguageTag.
		// but, all other messages except of 'onlyText' are tree-shaken away.
		expect(compiled.output[0].code).toBe(
			'const sourceLanguageTag="en";let _currentLanguageTag=sourceLanguageTag;const languageTag=()=>_currentLanguageTag;const onlyText=()=>{const contents={en:"A simple message.",de:"Eine einfache Nachricht."};return contents[languageTag()]};console.log(onlyText());\n',
		)
	})

	it("should include all messages that are used", async () => {
		const bundle = await rollup({
			input: "app.js",
			plugins: [
				removeComments(),
				// @ts-expect-error - rollup types are not up to date
				virtual({
					"messages.js": await fs.readFile(new URL("./messages.js", import.meta.url), "utf-8"),
					"runtime.js": await fs.readFile(new URL("./runtime.js", import.meta.url), "utf-8"),
					"app.js": `

					import * as m from "./messages.js"

					console.log(
						m.onlyText(),
						m.oneParam({ name: "John" }),
						m.multipleParams({ name: "John", count: 5 })
					)
					`,
				}),
			],
		})
		const result = await bundle.generate({ format: "esm" })
		expect(result.output[0].code).toBe(
			'const sourceLanguageTag="en";let _currentLanguageTag=sourceLanguageTag;const languageTag=()=>_currentLanguageTag;const onlyText=()=>{const contents={en:"A simple message.",de:"Eine einfache Nachricht."};return contents[languageTag()]};const oneParam=params=>{const contents={en:`Good morning ${params.name}!`,de:`Guten Morgen ${params.name}!`};return contents[languageTag()]??"oneParam"};const multipleParams=params=>{const contents={en:`Hello ${params.name}! You have ${params.count} messages.`,de:`Hallo ${params.name}! Du hast ${params.count} Nachrichten.`};return contents[languageTag()]??"multipleParams"};console.log(onlyText(),oneParam({name:"John"}),multipleParams({name:"John",count:5}));\n',
		)
	})
})

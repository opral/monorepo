import { describe, it, expect } from "vitest"
import { preprocess } from "./index.js"
import { LANGUAGE_TAG_ALIAS } from "../constants.js"
import glob from "tiny-glob"
import fs from "node:fs/promises"
import { basename, resolve } from "node:path"

const testFiles = await glob("./src/preprocessor/fixtures/*.svelte")
console.log(testFiles)

const preprocessor = preprocess()

describe("preprocessor", () => {
	for (const file of testFiles) {
		const filename = basename(file)
		const testName = filename.replace(".svelte", "").replace(/-/g, " ")

		it(testName, async () => {
			const filePath = resolve(process.cwd(), file)
			const content = await fs.readFile(filePath, "utf-8")

			const result = preprocessor.markup({ content, filename: filePath })
			expect(result.code).toMatchSnapshot()
		})
	}
})
import { createNodeishMemoryFs } from "@lix-js/fs"
import { describe, expect, it } from "vitest"
import { detectLanguageTags } from "./detectLanguageTags.js"

describe("detectedLanguageTags", () => {
	it("get correct LanguageTags with string pathPattern", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./en.json", "{}")
		await fs.writeFile("./de.json", "{}")
		await fs.writeFile("./fr.json", "{}")

		const detectedLanguages = await detectLanguageTags({
			pathPattern: "./{languageTag}.json",
			nodeishFs: fs,
		})

		expect(detectedLanguages).toStrictEqual(["en", "de", "fr"])
	})

	it("get correct LanguageTags with object pathPattern", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", "{}")
		await fs.mkdir("./de")
		await fs.writeFile("./de/common.json", "{}")

		const detectedLanguages = await detectLanguageTags({
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
			nodeishFs: fs,
		})

		expect(detectedLanguages).toStrictEqual(["en", "de"])
	})

	it("get correct LanguageTags with ignore", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./en.json", "{}")
		await fs.writeFile("./de.json", "{}")
		await fs.writeFile("./package.json", "{}")
		const detectedLanguages = await detectLanguageTags({
			pathPattern: "./{languageTag}.json",
			ignore: ["package.json"],
			nodeishFs: fs,
		})

		expect(detectedLanguages).toStrictEqual(["en", "de"])
	})
})

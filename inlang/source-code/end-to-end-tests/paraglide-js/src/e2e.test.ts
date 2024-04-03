import { describe, it, expect } from "vitest"
import { prepareEnvironment } from "@gmrchk/cli-testing-library"
import path from "node:path"
import child_process from "node:child_process"

const ParaglideLocation = child_process.execSync("which paraglide-js").toString().trim()

describe("paraglide-js", () => {
	it("prints it's version when run with --version", () => {
		const semverRegex = /[0-9]+\.[0-9]+\.[0-9]+/g
		const stdout = child_process.execSync("npx paraglide-js --version").toString()
		expect(semverRegex.test(stdout)).toBe(true)
	})

	describe("init", () => {
		it(
			"initializes paraglide if no project is present",
			async () => {
				const { spawn, writeFile, readFile, cleanup, path: workingDir } = await prepareEnvironment()
				await writeFile(path.resolve(workingDir, "package.json"), "{}")
				process.env.TERM_PROGRAM = "not-vscode"
				const { wait, waitForText, writeText, debug, pressKey } = await spawn(
					ParaglideLocation,
					"init"
				)

				debug()

				await waitForText("Which languages do you want to support?")
				await wait(200)
				await writeText("en, de")
				await wait(200)
				await pressKey("enter")

				await waitForText("Are you using Visual Studio Code?")
				await wait(200)
				await writeText("y")
				await wait(200)
				await pressKey("enter")

				await waitForText("Which tech stack are you using?")
				await wait(200)
				await pressKey("enter")
				await wait(1000)

				//check that the settings.json file exists
				const fileContent = await readFile(path.resolve(workingDir, "project.inlang/settings.json"))
				const settings = JSON.parse(fileContent)
				expect(settings.languageTags).toEqual(["en", "de"])
				expect(settings.sourceLanguageTag).toEqual("en")

				//Check that the messages/en.json and messages/de.json files exist
				expect(await readFile(path.resolve(workingDir, "messages/en.json"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "messages/de.json"))).toBeTruthy()

				await cleanup()
			},
			{ timeout: 30_000 }
		)
	})
})

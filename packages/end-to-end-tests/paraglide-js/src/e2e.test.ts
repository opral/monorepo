import { describe, it, expect } from "vitest"
import { prepareEnvironment } from "@gmrchk/cli-testing-library"
import path from "node:path"
import child_process from "node:child_process"
import type { ProjectSettings } from "@inlang/sdk"

const ParaglideLocation = child_process.execSync("which paraglide-js").toString().trim()

/**
 * Timeout to wait between a prompt appearing and the user input
 */
const PROMPT_TO = 800

/**
 * Time to wait between answering the last prompt & checking the output files
 */
const CLEANUP_TO = 5_000

describe.concurrent("paraglide-js", () => {
	it("prints it's version when run with --version", () => {
		const semverRegex = /[0-9]+\.[0-9]+\.[0-9]+/g
		const stdout = child_process.execSync("npx paraglide-js --version").toString()
		expect(semverRegex.test(stdout)).toBe(true)
	})

	describe.concurrent("init", () => {
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
				await wait(PROMPT_TO)
				await writeText("en, de")
				await wait(PROMPT_TO)
				await pressKey("enter")

				await waitForText("Where should the compiled files be placed?")
				await wait(PROMPT_TO)
				await pressKey("enter") // use default value of ./src/paraglide

				await waitForText("Are you using Visual Studio Code?")
				await wait(PROMPT_TO)
				await writeText("y")
				await wait(PROMPT_TO)
				await pressKey("enter")

				await waitForText("Github Action")
				await wait(PROMPT_TO)
				await writeText("y")
				await wait(PROMPT_TO)
				await pressKey("enter")

				await waitForText("Which tech stack are you using?")
				await wait(PROMPT_TO)
				await pressKey("enter")
				await wait(CLEANUP_TO)

				//check that the settings.json file exists
				const fileContent = await readFile(path.resolve(workingDir, "project.inlang/settings.json"))
				const settings = JSON.parse(fileContent)
				expect(settings.languageTags).toEqual(["en", "de"])
				expect(settings.sourceLanguageTag).toEqual("en")

				//Check that the messages/en.json and messages/de.json files exist
				expect(await readFile(path.resolve(workingDir, "messages/en.json"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "messages/de.json"))).toBeTruthy()

				//Check that the compiler ran and generated the files
				expect(await readFile(path.resolve(workingDir, "src/paraglide/runtime.js"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages.js"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages/en.js"))).includes(
					"export {}"
				)
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages/de.js"))).includes(
					"export {}"
				)

				const packageJson = JSON.parse(await readFile(path.resolve(workingDir, "package.json")))

				expect(packageJson.scripts.build).includes("--project ./project.inlang")
				expect(packageJson.scripts.postinstall).includes("--project ./project.inlang")

				const expectedVersion = child_process.execSync(ParaglideLocation + " --version").toString()
				expect(packageJson.devDependencies["@inlang/paraglide-js"].trim()).toEqual(
					expectedVersion.trim()
				)
				await cleanup()
			},
			{ timeout: 60_000 }
		)

		it(
			"initializes paraglide if another project is present",
			async () => {
				const { spawn, writeFile, readFile, cleanup, path: workingDir } = await prepareEnvironment()
				await writeFile(path.resolve(workingDir, "package.json"), "{}")
				process.env.TERM_PROGRAM = "not-vscode"

				const existingProject: ProjectSettings = {
					modules: [
						"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
						"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
					],
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],

					"plugin.inlang.messageFormat": {
						pathPattern: "./messages/{languageTag}.json",
					},
				}

				writeFile(
					path.resolve(workingDir, "some/path/project.inlang/settings.json"),
					JSON.stringify(existingProject)
				)

				const { wait, waitForText, writeText, debug, pressKey } = await spawn(
					ParaglideLocation,
					"init"
				)

				debug()

				await waitForText("Do you want to use an existing Inlang Project or create a new one?")
				await wait(PROMPT_TO)
				await pressKey("arrowDown") //should select the first existing project
				await wait(PROMPT_TO)
				await pressKey("enter")

				await waitForText("Where should the compiled files be placed?")
				await wait(PROMPT_TO)
				await pressKey("enter") // use default value of ./src/paraglide

				await waitForText("Are you using Visual Studio Code?")
				await wait(PROMPT_TO)
				await writeText("y")
				await wait(PROMPT_TO)
				await pressKey("enter")

				await waitForText("Which tech stack are you using?")
				await wait(PROMPT_TO)
				await pressKey("enter")
				await wait(CLEANUP_TO)

				//Check that the compiler ran and generated the files
				expect(await readFile(path.resolve(workingDir, "src/paraglide/runtime.js"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages.js"))).toBeTruthy()
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages/en.js"))).includes(
					"export {}"
				)
				expect(await readFile(path.resolve(workingDir, "src/paraglide/messages/de.js"))).includes(
					"export {}"
				)

				const packageJson = JSON.parse(await readFile(path.resolve(workingDir, "package.json")))

				expect(packageJson.scripts.build).includes("--project ./some/path/project.inlang")
				expect(packageJson.scripts.postinstall).includes("--project ./some/path/project.inlang")

				await cleanup()
			},
			{ timeout: 60_000 }
		)
	})
})

import { describe, it, expect } from "vitest"
import { prepareEnvironment } from "@gmrchk/cli-testing-library"
import path from "node:path"
import child_process from "node:child_process"

const ParaglideNextLocation = child_process.execSync("which paraglide-next").toString().trim()

if (!ParaglideNextLocation) {
	console.error("Could not find the paraglide-next binary")
	process.exit(1)
}

describe.concurrent("paraglide-next init", () => {
	it("prints it's version when run with --version", () => {
		const semverRegex = /[0-9]+\.[0-9]+\.[0-9]+/g
		const stdout = child_process.execSync(ParaglideNextLocation + " --version").toString()
		expect(semverRegex.test(stdout)).toBe(true)
	})

	describe.concurrent("init", () => {
		it(
			"initializes inside a fresh nextjs project with the app router and src/ dir",
			async () => {
				const { spawn, readFile, cleanup, path: workingDir } = await prepareEnvironment()

				console.info("Running create-next-app")

				const CNA = await spawn("npx", "create-next-app@latest test-app")

				await CNA.waitForText("TypeScript")
				await CNA.wait(500)
				await CNA.pressKey("arrowRight") //yes
				await CNA.pressKey("enter")

				console.info("create-next-app: TypeScript YES")

				await CNA.waitForText("ESLint")
				await CNA.wait(200)
				await CNA.pressKey("arrowLeft") //no
				await CNA.pressKey("enter")

				console.info("create-next-app: ESLint NO")

				await CNA.waitForText("Tailwind CSS")
				await CNA.wait(200)
				await CNA.pressKey("arrowLeft") //no
				await CNA.pressKey("enter")

				console.info("create-next-app: Tailwind CSS NO")

				await CNA.waitForText("`src/` directory")
				await CNA.wait(200)
				await CNA.pressKey("arrowRight") //yes
				await CNA.pressKey("enter")

				console.info("create-next-app: `src/` directory YES")

				await CNA.waitForText("App Router")
				await CNA.wait(200)
				await CNA.pressKey("arrowRight") //yes
				await CNA.pressKey("enter")

				console.info("create-next-app: App Router YES")

				await CNA.waitForText("import alias")
				await CNA.wait(200)
				await CNA.pressKey("arrowLeft") //no
				await CNA.pressKey("enter")

				console.info("create-next-app: edit import alias NO")

				await CNA.waitForFinish()

				console.info("Finished create-next-app")

				// Run paraglide-next init
				process.env.TERM_PROGRAM = "not-vscode"
				const PNI = await spawn(
					ParaglideNextLocation,
					"init",
					path.resolve(workingDir, "./test-app")
				)

				await PNI.waitForText("Which languages do you want to support?")
				await PNI.wait(200)
				await PNI.writeText("en, de")
				await PNI.wait(200)
				await PNI.pressKey("enter")

				console.info("Languages selected")

				await PNI.waitForText("Are you using Visual Studio Code?")
				await PNI.wait(200)
				await PNI.writeText("y")
				await PNI.wait(200)
				await PNI.pressKey("enter")

				console.info("Visual Studio Code selected")

				await PNI.waitForFinish()

				console.info("Finished paraglide-next init")

				const projectFile = await readFile(
					path.resolve(workingDir, "test-app/project.inlang/settings.json")
				)

				expect(projectFile).includes('"en"')
				expect(projectFile).includes('"de"')

				console.info(projectFile)
				await cleanup()
			},
			{ timeout: 60_000 }
		)
	})
})

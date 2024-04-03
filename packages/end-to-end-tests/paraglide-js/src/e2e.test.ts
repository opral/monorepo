import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import child_process from "node:child_process"
import { respondToPrompts, sleep } from "./utils.js"

const tmpDir = path.resolve(process.cwd(), ".tmp")

describe("paraglide-js", () => {
	it("prints it's version when run with --version", () => {
		const semverRegex = /[0-9]+\.[0-9]+\.[0-9]+/g
		const stdout = child_process.execSync("npx paraglide-js --version").toString()
		expect(semverRegex.test(stdout)).toBe(true)
	})

	describe("init", () => {
		beforeAll(async () => {
			//remove tmp dir if it exists
			try {
				await fs.stat(tmpDir)
				await fs.rmdir(tmpDir, { recursive: true })
			} catch (e) {
				//do nothing
			}
		})
		beforeEach(async () => {
			//create a tmp dir
			await fs.mkdir(tmpDir, { recursive: true })
			return async () => {
				await fs.rmdir(tmpDir, { recursive: true })
			}
		})

		it(
			"initializes paraglide if no project is present",
			async () => {
				await fs.stat(tmpDir)
				//create empty package.json
				await fs.writeFile(path.join(tmpDir, "package.json"), "{}", {
					encoding: "utf-8",
				})

				const process = child_process.spawn("npx", ["paraglide-js", "init"], {
					cwd: tmpDir,
				})

				await respondToPrompts(process, {
					"without committing your current changes?": {
						response: "y",
						required: false,
					},
					"Which languages do you want to support?": {
						response: "en, de \r\n",
						required: true,
					},
					"Which tech stack are you using?": {
						response: "\r\n",
						required: true,
					},
				})

				await sleep(500)
				process.kill()

				//expect project.inlang/settings.json to be created
				expect(await fs.stat(path.join(tmpDir, "project.inlang/settings.json"))).toBeDefined()
			},
			{ timeout: 60_000 }
		)
	})
})

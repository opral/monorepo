/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import childProcess from "node:child_process"
import { dirname, join } from "node:path"
import fs from "node:fs/promises"

const exec = promisify(childProcess.exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe.concurrent("sanity check run behavior", () => {
	it("pwd", async () => {
		const code = await run("pwd")
		expect(code === 0).toBeTruthy()
	})

	it("ls ./no_such_directory_here/ has non-zeru exit code", async () => {
		try {
			await run("ls ./no_such_directory_here/")
			throw new Error("should not reach this")
		} catch (e) {
			// @ts-ignore
			console.error(e)
			expect(e.code !== 0).toBeTruthy()
		}
	})
})

describe.concurrent(
	"translate multiple projects in different directories",
	() => {

		it(
			"project3 in project3-dir",
			async () => {
				await run("pnpm translate3")
				const result = await fs.readFile(
					join(__dirname, "project3-dir", "locales", "de.json"),
					"utf8"
				)
				expect(result).toEqual(`{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"project3_message_key_1": "Mock translate local en to de: Generated message (1)",
	"project3_message_key_2": "Mock translate local en to de: Generated message (2)",
	"project3_message_key_3": "Mock translate local en to de: Generated message (3)"
}`)
			},
			{ timeout: 30000 }
		)

		it(
			"project1 in root",
			async () => {
				await run("pnpm translate1")
				const result = await fs.readFile(join(__dirname, "locales", "de.json"), "utf8")
				expect(result).toEqual(`{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"project1_message_key_1": "Mock translate local en to de: Generated message (1)",
	"project1_message_key_2": "Mock translate local en to de: Generated message (2)",
	"project1_message_key_3": "Mock translate local en to de: Generated message (3)"
}`)
			},
			{ timeout: 10000 }
		)

		it(
			"project2 in project2-dir",
			async () => {
				await run("pnpm translate2")
				const result = await fs.readFile(
					join(__dirname, "project2-dir", "locales", "de.json"),
					"utf8"
				)
				expect(result).toEqual(`{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"project2_message_key_1": "Mock translate local en to de: Generated message (1)",
	"project2_message_key_2": "Mock translate local en to de: Generated message (2)",
	"project2_message_key_3": "Mock translate local en to de: Generated message (3)"
}`)
			},
			{ timeout: 10000 }
		)

	},
	{ timeout: 50000 }
)

// run command in __dirname
// resolves promise with 0 or rejects promise with error
// inherits stdio so that vitest shows output
function run(command: string): Promise<number> {
	return new Promise((resolve, reject) => {
		const p = childProcess.spawn(command, {
			cwd: __dirname,
			stdio: "inherit",
			shell: true,
			detached: false,
		})
		p.on("close", () => resolve(0))
		p.on("error", (err) => reject(err))
	})
}
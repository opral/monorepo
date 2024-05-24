import { describe, it, expect } from "vitest"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import childProcess from "node:child_process"
import fs from "node:fs/promises"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
			expect(e.message).toMatch("non-zero exit code")
		}
	})
})

describe.concurrent(
	"translate multiple projects in different directories",
	() => {
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

		// skip pending resolution of https://github.com/opral/lix-sdk/issues/18 (LIX-60)
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
			{ timeout: 20000 }
		)

		// skip pending new v2 persistence with translation.
		it(
			"project4 in project4-dir",
			async () => {
				const before = await fs.readFile(
					join(__dirname, "project4-dir", "messages.json.bak"),
					"utf8"
				)
				await fs.writeFile(
					join(__dirname, "project4-dir", "project.inlang", "messages.json"),
					before
				)
				await run("pnpm translate4")
				const expected = await fs.readFile(
					join(__dirname, "project4-dir", "messages.json.translated"),
					"utf8"
				)
				const result = await fs.readFile(
					join(__dirname, "project4-dir", "project.inlang", "messages.json"),
					"utf8"
				)
				expect(result).toEqual(expected)
			},
			{ timeout: 20000 }
		)
	},
	{ timeout: 40000 }
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
		p.on("close", (code) => {
			if (code === 0) {
				resolve(0)
			} else {
				reject(new Error(`${command}: non-zero exit code ${code}`))
			}
		})
		p.on("error", (err) => {
			reject(err)
		})
	})
}

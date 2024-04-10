/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from "vitest"
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

describe.concurrent("sanity check exec behavior", () => {
	it("pwd", async () => {
		const { stdout } = await exec("pwd", { cwd: __dirname })
		console.log(stdout)
		expect(stdout).toBe(`${__dirname}\n`)
	})

	it("ls ./no_such_directory_here/ has non-zeru exit code", async () => {
		try {
			await exec("ls ./no_such_directory_here/", { cwd: __dirname })
			throw new Error("should not reach this")
		} catch (e) {
			// @ts-ignore
			expect(e.code).toBe(1)
			// @ts-ignore
			expect(e.stderr).toBe("ls: ./no_such_directory_here/: No such file or directory\n")
		}
	})
})

describe.concurrent("translate multiple projects in different directories", () => {
	it(
		"project1 in root",
		async () => {
			await exec("pnpm  translate1", { cwd: __dirname })
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
			await exec("pnpm  translate2", { cwd: __dirname })
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

	it(
		"project3 in project3-dir",
		async () => {
			try {
				await exec("pnpm  translate3", { cwd: __dirname })
				await sleep(5000)
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
			} catch (e) {
				console.error(e)
				throw e
			}
		},
		{ timeout: 20000 }
	)
})
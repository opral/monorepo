import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { openRepository } from "@lix-js/client"
import { loadProject } from "./loadProject.js"

import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import childProcess from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(childProcess.exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repoI18next = join(__dirname, "..", "load-test", "repo-i18next")
const projectPath = join(repoI18next, "project.inlang")
const cli = join(__dirname, "..", "..", "cli", "bin", "run.js")

const translateCommand = cli + " machine translate -f --project ./project.inlang"

const mockServer = "http://localhost:3000"

describe("translate message with 1 source and 37 target languages", () => {
	beforeAll(async () => await checkIfServerIsRunning())
	beforeEach(async () => await clean())

	test(
		"open the project and translate messages using the cli",
		async () => {
			const repo = await openRepository(repoI18next, { nodeishFs: fs })
			const project = await loadProject({ repo, projectPath })
			project.errors.subscribe((errors) => {
				if (errors.length > 0) {
					// eslint-disable-next-line no-console
					console.log("project errors", errors[0])
				}
			})
			project.query.messages.getAll.subscribe((messages) => {
				// eslint-disable-next-line no-console
				console.log("messages changed", messages.length)
			})
			await generateSourceMessageFile(1000)
			// await new Promise((resolve) => setTimeout(resolve, 1000))
			// await exec(translateCommand, { cwd: repoI18next })
		},
		{ timeout: 60000 }
	)
})

async function checkIfServerIsRunning() {
	const { stdout } = await exec(`curl ${mockServer}/ping`)
	expect(stdout).toEqual(`${mockServer} MOCK_TRANSLATE\n`)
}

async function clean() {
	// eslint-disable-next-line no-console
	console.log("Cleaning repo-i18next")
	await exec("pnpm clean", { cwd: repoI18next })
}

async function generateSourceMessageFile(count: number) {
	const messages: Record<string, string> = {}
	for (let i = 1; i <= count; i++) {
		messages[`message_key_${i}`] = `Generated message (${i})`
	}
	await fs.writeFile(
		join(repoI18next, "locales", "en", "common.json"),
		JSON.stringify(messages, undefined, 2),
		"utf-8"
	)
}

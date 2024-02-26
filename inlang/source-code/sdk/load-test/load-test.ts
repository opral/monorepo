import { openRepository } from "@lix-js/client"
import { loadProject } from "@inlang/sdk"

import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import childProcess from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(childProcess.exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repoI18next = __dirname
const projectPath = join(repoI18next, "project.inlang")

const mockServer = "http://localhost:3000"

const cli = `PUBLIC_SERVER_BASE_URL=${mockServer} pnpm inlang`
const translateCommand = cli + " machine translate -f --project ./project.inlang"

export async function runLoadTest(messageCount: number = 1000, translate: boolean = true) {
	if (translate && !(await isServerRunning())) {
		console.error(
			`Please start the mock rpc server with "MOCK_TRANSLATE=true pnpm --filter @inlang/server dev"`
		)
		return
	}

	console.log("opening repo and loading project")
	const repo = await openRepository(repoI18next, { nodeishFs: fs })
	const project = await loadProject({ repo, projectPath })

	console.log("subscribing to project.errors")
	project.errors.subscribe((errors) => {
		if (errors.length > 0) {
			console.log("project errors", errors[0])
		}
	})

	console.log("subscribing to messages.getAll")
	project.query.messages.getAll.subscribe((messages) => {
		console.log("messages changed", messages.length)
	})

	await generateMessageFile(messageCount)

	if (translate) {
		console.log("translating messages - shipping cli will pause for 8s when done")
		await exec(translateCommand, { cwd: repoI18next })
	}
}

async function generateMessageFile(messageCount: number) {
	const messages: Record<string, string> = {}
	console.log(`generating ${messageCount} messages`)
	for (let i = 1; i <= messageCount; i++) {
		messages[`message_key_${i}`] = `Generated message (${i})`
	}
	await fs.writeFile(
		join(".", "locales", "en", "common.json"),
		JSON.stringify(messages, undefined, 2),
		"utf-8"
	)
	console.log(`finished generating ${messageCount} messages`)
}

async function isServerRunning(): Promise<boolean> {
	try {
		await exec(`curl ${mockServer}/ping`)
		return true
	} catch (error) {
		return false
	}
}

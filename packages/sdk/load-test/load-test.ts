/* eslint-disable no-restricted-imports */
/* eslint-disable no-console */
import { openRepository } from "@lix-js/client"
import { loadProject } from "@inlang/sdk"

import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import childProcess from "node:child_process"
import { promisify } from "node:util"

import _debug from "debug"
const debug = _debug("load-test")

const exec = promisify(childProcess.exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectPath = join(__dirname, "project.inlang")

const mockServer = "http://localhost:3000"

const cli = `PUBLIC_SERVER_BASE_URL=${mockServer} pnpm inlang`
const translateCommand = cli + " machine translate -f --project ./project.inlang"

const messageDir = join(__dirname, "locales", "en")
const messageFile = join(__dirname, "locales", "en", "common.json")


export async function runLoadTest(
	messageCount: number = 1000,
	translate: boolean = true,
	subscribeToMessages: boolean = true,
	subscribeToLintReports: boolean = false
) {
	debug("load-test start")

	if (translate && !(await isServerRunning())) {
		console.error(
			`Please start the mock rpc server with "MOCK_TRANSLATE=true pnpm --filter @inlang/server dev"`
		)
		return
	}

	await generateMessageFile(1)

	debug("opening repo and loading project")
	const repo = await openRepository(__dirname, { nodeishFs: fs })
	const project = await loadProject({ repo, projectPath })

	debug("subscribing to project.errors")
	project.errors.subscribe((errors) => {
		if (errors.length > 0) {
			debug(`load=test project errors ${errors[0]}`)
		}
	})

	if (subscribeToMessages) {
		debug("subscribing to messages.getAll")
		let messagesEvents = 0
		project.query.messages.getAll.subscribe((messages) => {
			if (messagesEvents++ % 1000 === 1) {
				debug(`messages changed ${messages.length}`)
			}
		})
	}

	if (subscribeToLintReports) {
		debug("subscribing to lintReports.getAll")
		let lintEvents = 0
		project.query.messageLintReports.getAll.subscribe((reports) => {
			if (lintEvents++ % 1000 === 1) {
				debug(`lint reports changed ${reports.length}`)
			}
		})
	}

	debug(`generating ${messageCount} messages`)
	await generateMessageFile(messageCount)

	if (translate) {
		debug("translating messages with inlang cli")
		await exec(translateCommand, { cwd: __dirname })
	}
	debug("load-test end")
}

async function generateMessageFile(messageCount: number) {
	await exec(`mkdir -p ${messageDir}`)
	const messages: Record<string, string> = {}
	for (let i = 1; i <= messageCount; i++) {
		messages[`message_key_${i}`] = `Generated message (${i})`
	}
	await fs.writeFile(
		messageFile,
		JSON.stringify(messages, undefined, 2),
		"utf-8"
	)
}

async function isServerRunning(): Promise<boolean> {
	try {
		await exec(`curl ${mockServer}/ping`)
		return true
	} catch (error) {
		return false
	}
}


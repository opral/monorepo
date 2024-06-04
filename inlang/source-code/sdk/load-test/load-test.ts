/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import { findRepoRoot, openRepository } from "@lix-js/client"
import { loadProject, type InlangProject, type Message, type ProjectSettings } from "@inlang/sdk"

import {
	createMessage,
	createMessageBundle,
	addSlots,
	injectJSONNewlines,
} from "../src/v2/helper.js"
import { MessageBundle } from "../src/v2/types.js"

import { createEffect } from "../src/reactivity/solid.js"

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { throttle } from "throttle-debounce"
import childProcess from "node:child_process"
import fs from "node:fs/promises"

import _debug from "debug"
const debug = _debug("load-test")

const throttleMessageGetAllEvents = 3000
const throttleLintEvents = 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectPath = join(__dirname, "project.inlang")

const mockServer = "http://localhost:3000"

const cli = `PUBLIC_SERVER_BASE_URL=${mockServer} pnpm inlang`
const translateCommand = cli + " machine translate -f -q -n --project ./project.inlang"

export async function runLoadTest(
	messageCount: number = 1000,
	translate: boolean = true,
	subscribeToMessages: boolean = true,
	subscribeToLintReports: boolean = false,
	watchMode: boolean = false
) {
	const settings = await getSettings()
	// experimental persistence uses v2 types
	const isV2 = !!settings.experimental?.persistence
	const locales = settings.languageTags
	debug(
		"load-test start" +
			(watchMode ? " - watchMode on, ctrl C to exit" : "") +
			(isV2 ? " - using experimental persistence" : "")
	)
	if (translate && !process.env.MOCK_TRANSLATE_LOCAL && !(await isMockRpcServerRunning())) {
		console.error(
			`Please start the mock rpc server with "MOCK_TRANSLATE=true pnpm --filter @inlang/server dev"`
		)
		return
	}

	process.on("SIGINT", () => {
		debug("bye bye")
		process.exit(0)
	})

	debug(`generating ${messageCount} messages`)
	// this is called before loadProject() to avoid reading partially written JSON
	await generateMessageFile(isV2, messageCount, locales)

	debug("opening repo and loading project")
	const repoRoot = await findRepoRoot({ nodeishFs: fs, path: __dirname })
	if (!repoRoot) {
		debug("no repo root.")
		return
	}
	const repo = await openRepository(repoRoot, { nodeishFs: fs })
	const project = await loadProject({ repo, projectPath })

	debug("subscribing to project.errors")
	project.errors.subscribe((errors) => {
		if (errors.length > 0) {
			debug(`load=test project errors ${errors[0]}`)
		}
	})

	if (subscribeToMessages && !isV2) {
		debug("subscribing to messages.getAll")
		let countMessagesGetAllEvents = 0

		const messagesGetAllEvent = throttle(
			throttleMessageGetAllEvents,
			(messages: readonly Message[]) => {
				debug(`messages getAll event: ${countMessagesGetAllEvents}, length: ${messages.length}`)
			}
		)

		createEffect(() => {
			countMessagesGetAllEvents++
			messagesGetAllEvent(project.query.messages.getAll())
		})
	}

	if (subscribeToLintReports && !isV2) {
		debug("subscribing to lintReports.getAll")
		let lintEvents = 0
		const logLintEvent = throttle(throttleLintEvents, (reports: any) => {
			debug(`lint reports changed event: ${lintEvents}, length: ${reports.length}`)
		})
		project.query.messageLintReports.getAll.subscribe((reports) => {
			lintEvents++
			logLintEvent(reports)
		})
	}

	if (isV2) {
		await summarize("loaded", project)
	}

	if (translate) {
		debug("translating messages with inlang cli")
		await run(translateCommand)
		if (isV2) {
			await project.store?.messageBundles.reload()
			await summarize("translated", project)
		}
	}

	debug("load-test done - " + (watchMode ? "watching for events" : "exiting"))

	if (watchMode) {
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 1000 * 60 * 60 * 24)
		})
	}
}

async function summarize(action: string, project: InlangProject) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const bundles = await project.store!.messageBundles.getAll()
	let bundleCount = 0
	let messageCount = 0
	bundles.map((bundle) => {
		bundleCount++
		messageCount += bundle.messages.length
	})
	debug(`${action}: ${bundleCount} bundles, ${messageCount / bundleCount} messages/bundle`)
}

async function generateMessageFile(isV2: boolean, messageCount: number, locales: string[]) {
	if (isV2) {
		const messageFile = join(__dirname, "project.inlang", "messages.json")

		const messages: MessageBundle[] = []
		for (let i = 1; i <= messageCount; i++) {
			messages.push(
				createMessageBundle({
					id: `message_key_${i}`,
					messages: [createMessage({ locale: "en", text: `Generated message (${i})` })],
				})
			)
		}
		const output = injectJSONNewlines(
			JSON.stringify(messages.map((bundle) => addSlots(bundle, locales)))
		)
		await fs.writeFile(messageFile, output, "utf-8")
	} else {
		const messageDir = join(__dirname, "locales", "en")
		const messageFile = join(__dirname, "locales", "en", "common.json")

		await run(`mkdir -p ${messageDir}`)
		const messages: Record<string, string> = {}
		for (let i = 1; i <= messageCount; i++) {
			messages[`message_key_${i}`] = `Generated message (${i})`
		}
		await fs.writeFile(messageFile, JSON.stringify(messages, undefined, 2), "utf-8")
	}
}

async function getSettings() {
	const settingsFile = join(__dirname, "project.inlang", "settings.json")
	const settings = JSON.parse(await fs.readFile(settingsFile, "utf-8"))
	return settings as ProjectSettings
}

async function isMockRpcServerRunning(): Promise<boolean> {
	try {
		const req = await fetch(`${mockServer}/ping`)
		if (!req.ok) {
			console.error(`Mock rpc server responded with status: ${req.status}`)
			return false
		}
		const res = await req.text()
		const expected = `${mockServer} MOCK_TRANSLATE\n`
		if (res !== expected) {
			console.error(
				`Mock rpc server responded with: ${JSON.stringify(res)} instead of ${JSON.stringify(
					expected
				)}`
			)
			return false
		}
	} catch (error) {
		console.error(`Mock rpc server error: ${error} ${causeString(error)}`)
		return false
	}
	return true
}

function causeString(error: any): string {
	if (typeof error === "object" && error.cause) {
		if (error.cause.errors?.length) return error.cause.errors.join(", ")
		if (error.cause.code) return "" + error.cause.code
		return JSON.stringify(error.cause)
	}
	return ""
}

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

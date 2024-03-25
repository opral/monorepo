import { createUnplugin } from "unplugin"
import { Message, ProjectSettings, loadProject, type InlangProject } from "@inlang/sdk"
import { openRepository, findRepoRoot } from "@lix-js/client"
import path from "node:path"
import fs from "node:fs/promises"
import { compile, writeOutput, Logger } from "@inlang/paraglide-js/internal"
import crypto from "node:crypto"

const PLUGIN_NAME = "unplugin-paraglide"

export type UserConfig = {
	project: string
	outdir: string
	silent?: boolean
}

export const paraglide = createUnplugin((config: UserConfig) => {
	const options = {
		silent: false,
		...config,
	}

	const projectPath = path.resolve(process.cwd(), options.project)
	const outputDirectory = path.resolve(process.cwd(), options.outdir)
	const logger = new Logger({ silent: options.silent, prefix: true })

	//Keep track of how many times we've compiled
	let numCompiles = 0

	let previousMessagesHash: string | undefined = undefined

	async function triggerCompile(messages: readonly Message[], settings: ProjectSettings) {
		const currentMessagesHash = hashMessages(messages, settings)
		if (currentMessagesHash === previousMessagesHash) return

		if (messages.length === 0) {
			logger.warn(`No messages found - Skipping compilation into ${options.outdir}`)
			return
		}

		logMessageChange()
		const output = await compile({ messages, settings })
		await writeOutput(outputDirectory, output, fs)
		numCompiles++
		previousMessagesHash = currentMessagesHash
	}

	function logMessageChange() {
		if (!logger) return
		if (options.silent) return

		if (numCompiles === 0) {
			logger.info(`Compiling Messages into ${options.outdir}`)
		}

		if (numCompiles >= 1) {
			logger.info(`Messages changed - Recompiling into ${options.outdir}`)
		}
	}

	let project: InlangProject | undefined = undefined
	async function getProject(): Promise<InlangProject> {
		if (project) return project

		const repoRoot = await findRepoRoot({ nodeishFs: fs, path: projectPath })

		const repo = await openRepository(repoRoot || "file://" + process.cwd(), {
			nodeishFs: fs,
		})

		project = await loadProject({
			appId: "library.inlang.paraglideJs",
			projectPath: path.resolve(process.cwd(), options.project),
			repo,
		})

		return project
	}

	return {
		name: PLUGIN_NAME,

		enforce: "pre",
		async buildStart() {
			const project = await getProject()

			//Always fully compile once on build start
			await triggerCompile(project.query.messages.getAll(), project.settings())

			let numInvocations = 0
			project.query.messages.getAll.subscribe((messages) => {
				numInvocations++
				if (numInvocations === 1) return
				triggerCompile(messages, project.settings())
			})
		},

		webpack(compiler) {
			//we need the compiler to run before the build so that the message-modules will be present
			//In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
			compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
				const project = await getProject()
				await triggerCompile(project.query.messages.getAll(), project.settings())
				console.info(`Compiled Messages into ${options.outdir}`)
			})
		},
	}
})

function hashMessages(messages: readonly Message[], settings: ProjectSettings): string {
	const hash = crypto.createHash("sha256")
	hash.update(JSON.stringify(messages))
	hash.update(JSON.stringify(settings))
	return hash.digest("hex")
}

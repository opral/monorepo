import { createUnplugin } from "unplugin"
import {
	Message,
	ProjectSettings,
	loadProject,
	type InlangProject,
	normalizeMessage,
} from "@inlang/sdk"
import { openRepository, findRepoRoot } from "@lix-js/client"
import path from "node:path"
import fs from "node:fs/promises"
import { compile, writeOutput, Logger } from "@inlang/paraglide-js/internal"
import crypto from "node:crypto"

const PLUGIN_NAME = "unplugin-paraglide"
const VITE_BUILD_PLUGIN_NAME = "unplugin-paraglide-vite-virtual-message-modules"

const isWindows = typeof process !== "undefined" && process.platform === "win32"

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
	let normalizedOutdir = outputDirectory.replaceAll("\\", "/")
	if (!normalizedOutdir.endsWith("/")) normalizedOutdir = normalizedOutdir + "/"
	const logger = new Logger({ silent: options.silent, prefix: true })

	//Keep track of how many times we've compiled
	let numCompiles = 0
	let previousMessagesHash: string | undefined = undefined

	let virtualModuleOutput: Record<string, string> = {}

	async function triggerCompile(messages: readonly Message[], settings: ProjectSettings) {
		const currentMessagesHash = hashMessages(messages ?? [], settings)
		if (currentMessagesHash === previousMessagesHash) return

		if (messages.length === 0) {
			logger.warn(`No messages found - Skipping compilation into ${options.outdir}`)
			return
		}

		logMessageChange()
		previousMessagesHash = currentMessagesHash

		const [regularOutput, messageModulesOutput] = await Promise.all([
			compile({ messages, settings, outputStructure: "regular" }),
			compile({ messages, settings, outputStructure: "message-modules" }),
		])

		virtualModuleOutput = messageModulesOutput
		const fsOutput = regularOutput

		await writeOutput(outputDirectory, fsOutput, fs)
		numCompiles++
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

	// if build

	return [
		{
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
		},
		{
			name: VITE_BUILD_PLUGIN_NAME,
			vite: {
				apply: "build",
				resolveId(id, importer) {
					// resolve relative imports inside the output directory
					// the importer is alwazs normalized
					if (importer?.startsWith(normalizedOutdir)) {
						const dirname = path.dirname(importer).replaceAll("\\", "/")
						if (id.startsWith(dirname)) return id

						if (isWindows) {
							const resolvedPath = path
								.resolve(dirname.replaceAll("/", "\\"), id.replaceAll("/", "\\"))
								.replaceAll("\\", "/")
							return resolvedPath
						}

						const resolvedPath = path.resolve(dirname, id)
						return resolvedPath
					}
					return undefined
				},

				load(id) {
					id = id.replaceAll("\\", "/")
					//if it starts with the outdir use the paraglideOutput virtual modules instead
					if (id.startsWith(normalizedOutdir)) {
						const internal = id.slice(normalizedOutdir.length)
						const resolved = virtualModuleOutput[internal]
						return resolved
					}

					return undefined
				},
			},
		},
	]
})

export function hashMessages(messages: readonly Message[], settings: ProjectSettings): string {
	const normalizedMessages = messages
		.map(normalizeMessage)
		.sort((a, b) => a.id.localeCompare(b.id, "en"))

	try {
		const hash = crypto.createHash("sha256")
		hash.update(JSON.stringify(normalizedMessages))
		hash.update(JSON.stringify(settings))
		return hash.digest("hex")
	} catch (e) {
		return crypto.randomUUID()
	}
}

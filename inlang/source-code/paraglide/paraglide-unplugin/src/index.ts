import path from "node:path"
import fs from "node:fs/promises"

import { createUnplugin, type UnpluginFactory } from "unplugin"
import { Message, ProjectSettings, loadProject, type InlangProject } from "@inlang/sdk"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { compile, writeOutput, classifyProjectErrors } from "@inlang/paraglide-js/internal"

import { type UserConfig, resolveConfig } from "./config.js"
import { virtual } from "./virtual.js"
import { generateDTS } from "./dts.js"
import { makeArray } from "./utils.js"
import { memoized } from "./memo.js"

const PLUGIN_NAME = "unplugin-paraglide"
const VITE_BUILD_PLUGIN_NAME = "unplugin-paraglide-vite-virtual-message-modules"

const VIRTUAL_MODULE_NAME = "$paraglide"
const DTS_FILE_LOCATION = "./paraglide.d.ts"

const isWindows = typeof process !== "undefined" && process.platform === "win32"
const plugin: UnpluginFactory<UserConfig> = (userConfig, ctx) => {
	const c = resolveConfig(userConfig)

	//Keep track of how many times we've compiled
	let numCompiles = 0
	let virtualModuleOutput: Record<string, string> = {}

	const triggerCompile = memoized(async function (
		messages: readonly Message[],
		settings: ProjectSettings,
		projectId: string | undefined
	) {
		if (messages.length === 0) {
			c.logger.warn("No messages found - Skipping compilation")
			return
		}

		logMessageChange()
		const [regularOutput, messageModulesOutput] = await Promise.all([
			compile({
				messages,
				settings,
				outputStructure: "regular",
				projectId,
			}),
			compile({ messages, settings, outputStructure: "message-modules", projectId }),
		])

		virtualModuleOutput = messageModulesOutput

		if (c.outdir) {
			await writeOutput(c.outdir, regularOutput, fs)
		} else {
			const dts = generateDTS(regularOutput, VIRTUAL_MODULE_NAME)
			await fs.writeFile(DTS_FILE_LOCATION, dts)
		}
		numCompiles++
	})

	function logMessageChange() {
		if (!c.logger) return
		if (numCompiles === 0) c.logger.info(`Compiling Messages${c.outdir ? `into ${c.outdir}` : ""}`)
		else if (numCompiles >= 1)
			c.logger.info(`Messages changed - Recompiling${c.outdir ? `into ${c.outdir}` : ""}`)
	}

	let project: InlangProject | undefined = undefined
	async function getProject(): Promise<InlangProject> {
		if (project) return project
		const repoRoot = await findRepoRoot({ nodeishFs: fs, path: c.projectPath })
		const repo = await openRepository(repoRoot || "file://" + process.cwd(), {
			nodeishFs: fs,
		})

		project = await loadProject({
			appId: "library.inlang.paraglideJs",
			projectPath: c.projectPath,
			repo,
		})

		return project
	}

	/**
	 * Returns the paraglide module at the given path:
	 * @example
	 * ```
	 * getModule("runtime.js")
	 * getModule("messages/en.js")
	 * ```
	 */
	function getModule(path: string): string | undefined {
		return virtualModuleOutput[path]
	}

	return [
		{
			name: PLUGIN_NAME,

			enforce: "pre",
			async buildStart() {
				const project = await getProject()

				const initialMessages = project.query.messages.getAll()
				const settings = project.settings()
				await triggerCompile(initialMessages, settings, project.id)

				project.errors.subscribe((errors) => {
					if (errors.length === 0) return

					const { fatalErrors, nonFatalErrors } = classifyProjectErrors(errors)
					for (const error of nonFatalErrors) {
						c.logger.warn(error.message)
					}

					for (const error of fatalErrors) {
						if (error instanceof Error) {
							c.logger.error(error.message) // hide the stack trace
						} else {
							c.logger.error(error)
						}
					}
				})

				let numInvocations = 0
				project.query.messages.getAll.subscribe((messages) => {
					numInvocations++
					if (numInvocations === 1) return
					triggerCompile(messages, project.settings(), project.id)
				})
			},

			webpack(compiler) {
				//we need the compiler to run before the build so that the message-modules will be present
				//In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
				compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
					const project = await getProject()
					await triggerCompile(project.query.messages.getAll(), project.settings(), project.id)
				})
			},
		},
		...makeArray(
			virtual(
				{
					name: VIRTUAL_MODULE_NAME,
					getModule,
				},
				ctx
			)
		),
		{
			name: VITE_BUILD_PLUGIN_NAME,
			vite: {
				apply: "build",
				resolveId(id, importer) {
					if (!c.outdir) return
					// if the id contains a null char ignore it since it should be a rollup virtual module
					// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
					if (id.includes("\0")) return undefined
					// resolve relative imports inside the output directory
					// the importer is always normalized
					if (importer?.startsWith(c.outdir)) {
						const dirname = path.dirname(importer).replaceAll("\\", "/")
						if (id.startsWith(dirname)) return id
						//TODO: Return virtual module path instead
						// should get rid of windows dependency aswell

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
					if (!c.outdir) return
					id = id.replaceAll("\\", "/")
					//if it starts with the outdir use the paraglideOutput virtual modules instead
					if (id.startsWith(c.outdir)) {
						const internal = id.slice(c.outdir.length)
						const resolved = virtualModuleOutput[internal]
						return resolved
					}

					return undefined
				},
			},
		},
	]
}

export const paraglide = createUnplugin(plugin)

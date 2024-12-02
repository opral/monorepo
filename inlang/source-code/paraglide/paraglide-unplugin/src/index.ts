import fs from "node:fs/promises"

import { createUnplugin, type UnpluginFactory } from "unplugin"
import { Message, ModuleError, ProjectSettings, loadProject, type InlangProject } from "@inlang/sdk"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { compile, writeOutput, classifyProjectErrors } from "@inlang/paraglide-js/internal"

import { type UserConfig, resolveConfig } from "./config.js"
import { generateDTS } from "./dts.js"
import { makeArray } from "./utils.js"
import { memoized } from "./memo.js"

// Helper Plugins
import { virtual } from "./virtual.js"
import { build } from "./build.js"

const PLUGIN_NAME = "unplugin-paraglide"
const VIRTUAL_MODULE_NAME = "$paraglide"
const DTS_FILE_LOCATION = "./paraglide.d.ts"

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
			compile({ messages, settings, outputStructure: "regular", projectId }),
			compile({ messages, settings, outputStructure: "message-modules", projectId }),
		])

		virtualModuleOutput = messageModulesOutput

		if (c.outdir) {
			await writeOutput(c.outdir, regularOutput, fs)
		} else {
			const dts = generateDTS(regularOutput, VIRTUAL_MODULE_NAME)
			console.log(DTS_FILE_LOCATION, dts)
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
	async function getModule(path: string): Promise<string | undefined> {
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
					if (numInvocations === 1) return // skip writing the first time, since we just called compile
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
		...makeArray(build(c, ctx)),
	]
}

export const paraglide = createUnplugin(plugin)

import type { InlangInstance } from "./api.js"
import { ImportFunction, resolveModules } from "@inlang/module"
// @ts-ignore
import { createSignal, createRoot, createEffect } from "solid-js/dist/solid.js"
import { NodeishFilesystemSubset, InlangConfig, createQuery } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { InvalidConfigError } from "./errors.js"
import { lintMessages } from "@inlang/lint"

const ConfigCompiler = TypeCompiler.Compile(InlangConfig)

/**
 * Creates an inlang instance.
 *
 * - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy modules such as CJS.
 *
 */
export async function createInlang(args: {
	configPath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}): Promise<InlangInstance> {
	return createRoot(async () => {
		const errors: Array<InvalidConfigError> = []

		// just for testing
		if (!args.nodeishFs) return {} as any
		// TODO #1182 the filesystem type is incorrect. manual type casting is required
		const configFile = (await args.nodeishFs.readFile(args.configPath, {
			encoding: "utf-8",
		})) as string
		const parsedConfig = JSON.parse(configFile)
		const typeErrors = [...ConfigCompiler.Errors(parsedConfig)]

		// -- USES INVALID SCHEMA --
		if (typeErrors.length > 0) {
			errors.push(
				new InvalidConfigError(`The config is invalid according to the schema.`, {
					cause: errors,
				}),
			)
		}

		// config reactivity
		const [config, setConfig] = createSignal(parsedConfig)

		// derived signals
		const [lintRules, setLintRules] = createSignal([])
		const [lintReports, setLintReports] = createSignal([])
		const [lintExceptions, setLintExceptions] = createSignal([])

		// init signals
		const [initLints, setInitLints] = createSignal(false)

		// access plugins (not reactive)
		const plugins = (
			await resolveModules({
				config: parsedConfig,
				nodeishFs: args.nodeishFs,
				_import: args._import,
			})
		).data.plugins.data

		// access messages (not reactive)
		const messages = await plugins.loadMessages({
			languageTags: ["en"],
		})

		// set derived signals
		const onConfigChange = async (config: InlangConfig, initLints: boolean) => {
			const resolvedModules = await resolveModules({
				config,
				nodeishFs: args.nodeishFs,
				_import: args._import,
			})
			setLintRules(resolvedModules.data.lintRules)
			if (initLints) {
				const lintReports = await lintMessages({
					config,
					query: createQuery(messages),
					messages: messages,
					rules: resolvedModules.data.lintRules,
				})
				setLintReports(lintReports.data)
				setLintExceptions(lintReports.errors)
			}
		}

		// trigger derived signals
		createEffect(() => {
			onConfigChange(config(), setInitLints())
		})

		// createEffect(() => {
		// 	console.log(lintReports())
		// })

		return {
			config: {
				get: config,
				set: setConfig,
			},
			lint: {
				rules: {
					get: lintRules,
				},
				reports: {
					get: lintReports,
					init: () => initLints(true),
				},
				exceptions: {
					get: lintExceptions,
					init: () => initLints(true),
				},
			},
			plugins,
			messages: {
				query: createQuery(messages),
			},
		} as InlangInstance
	})
}

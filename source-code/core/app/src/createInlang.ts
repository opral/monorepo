import type { InlangInstance } from "./api.js"
import { ImportFunction, resolveModules } from "@inlang/module"
// @ts-ignore
import {
	createSignal,
	createRoot,
	createMemo,
	createEffect,
	createResource,
} from "solid-js/dist/solid.js"
import { NodeishFilesystemSubset, InlangConfig, createQuery, ResolvedPlugins } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { InvalidConfigError } from "./errors.js"

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
		const [config, setConfig] = createSignal(parsedConfig as InlangConfig)

		// resolve modules
		const getResolvedModules = async (config: InlangConfig) => {
			const resolvedModules = await resolveModules({
				config,
				nodeishFs: args.nodeishFs,
				_import: args._import,
			})
			return resolvedModules
		}

		const resolvedModules = await resolveModules({
			config: parsedConfig,
			nodeishFs: args.nodeishFs,
			_import: args._import,
		})

		// access plugins
		const plugins = resolvedModules.data.plugins.data

		// lint rules derived reactivity
		const getLintRules = async () => {
			if (config()) {
				const resolvedModules = await resolveModules({
					config: config(),
					nodeishFs: args.nodeishFs,
					_import: args._import,
				})
				return resolvedModules.data.lintRules.map((rule) => rule.meta)
			} else {
				return []
			}
		}

		const messages = await plugins.loadMessages({
			languageTags: ["en"],
		})

		// lint reports reactivity
		const [lintReports] = createSignal({})

		return {
			config: {
				get: config,
				set: setConfig,
			},
			lint: {
				rules: {
					get: {} as any,
				},
				reports: {
					get: lintReports,
				} as any,
				exceptions: {} as any,
			},
			plugins: {} as any,
			messages: {
				query: createQuery(messages),
			},
		} satisfies InlangInstance
	})
}

import type { InlangInstance } from "./api.js"
import { ImportFunction, ResolveModulesFunction, resolveModules } from "@inlang/module"
import {
	NodeishFilesystemSubset,
	InlangConfig,
	createQuery,
	ResolvedPlugins,
	Message,
	tryCatch,
	Plugin,
} from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import { InvalidConfigError } from "./errors.js"
import { LintError, LintReport, LintRule, lintMessages } from "@inlang/lint"
import { createRoot, createSignal, createEffect } from "./solid.js"

const ConfigCompiler = TypeCompiler.Compile(InlangConfig)

/**
 * Creates an inlang instance.
 *
 * - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy modules such as CJS.
 *
 */
export const createInlang = async (args: {
	configPath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}): Promise<InlangInstance> =>
	createRoot(async () => {
		const [initialized, markInitAsComplete] = createAwaitable()

		// -- config ------------------------------------------------------------

		const [config, setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			loadConfig({ configPath: args.configPath, nodeishFs: args.nodeishFs }).then(setConfig)
		})
		// TODO: create FS watcher and update config on change

		// -- modules -----------------------------------------------------------

		const [modules, setModules] = createSignal<Awaited<ReturnType<ResolveModulesFunction>>>()
		const [plugins, setPlugins] = createSignal<ResolvedPlugins>()
		const [lintRules, setLintRules] = createSignal<Pick<LintRule, "meta">[]>([])
		createEffect(() => {
			const conf = config()
			if (!conf) return

			loadModules({ config: conf, nodeishFs: args.nodeishFs, _import: args._import }).then(
				(modules) => {
					setModules(modules)
					setPlugins(modules.data.plugins.data)
					setLintRules(modules.data.lintRules.data)

					// TODO: handle `detectedLanguageTags`
				},
			)
		})

		// -- messages ----------------------------------------------------------

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			const plugs = plugins()
			if (!plugs) return

			makeTrulyAsync(plugs.loadMessages({ languageTags: config()!.languageTags })).then(
				(messages) => {
					setMessages(messages)

					markInitAsComplete()
				},
			)
		})

		// const query = createQuery(messages() || []) // TODO: make query reactive

		// -- lint --------------------------------------------------------------

		const [lintInitialized, setLintInitialized] = createSignal(false)
		const [lintReportsInitialized, markLintReportsAsInitialized] = createAwaitable()
		const initLint = () => {
			setLintInitialized(true)
			return lintReportsInitialized
		}

		const [lintReports, setLintReports] = createSignal<LintReport[]>()
		const [lintErrors, setLintErrors] = createSignal<LintError[]>()
		createEffect(() => {
			const msgs = messages()
			if (!msgs || !lintInitialized()) return

			// TODO: only lint changed messages and update arrays selectively
			lintMessages({
				config: config() as InlangConfig,
				messages: msgs,
				query: queryMessages,
				rules: lintRules() as LintRule[],
			}).then((report) => {
				setLintReports(report.data)
				setLintErrors(report.errors)

				markLintReportsAsInitialized()
			})
		})

		// -- app ---------------------------------------------------------------

		await initialized

		// TODO: remove workaround and init reactive query above
		const queryMessages = createQuery(messages() || [])

		return {
			meta: {
				modules: () => [
					...new Set([
						...Object.values(modules()!.data.module.meta.lintRules),
						...Object.values(modules()!.data.module.meta.plugins),
					]),
				],
				lintRules: () =>
					modules()!.data.lintRules.data.map((rule) => {
						return {
							...rule.meta,
							module: modules()!.data.module.meta.lintRules[rule.meta.id as `${string}.${string}`],
						} as LintRule["meta"] & { module: string }
					}),
				plugins: () =>
					Object.entries(modules()!.data.plugins.data.meta).map(([id, meta]) => {
						return {
							...meta,
							module: modules()!.data.module.meta.plugins[id as `${string}.${string}`],
						} as Plugin["meta"] & { module: string }
					}),
			},
			errors: {
				module: () => modules()!.errors,
				plugin: () => modules()!.data.plugins.errors,
				lintRules: () => [...modules()!.data.lintRules.errors, ...(lintErrors() || [])],
			},
			config: config as () => InlangConfig,
			setConfig: setConfig,
			lint: {
				init: initLint,
				reports: () => {
					const reports = lintReports()
					// TODO: improve error
					if (!reports) throw new Error("lint not initialized yet")
					return reports
				},
			},
			appSpecificApi: () => plugins()!.appSpecificApi, // TODO: make reactive (using store)
			query: {
				messages: queryMessages,
			},
		} satisfies InlangInstance
	})

const loadConfig = async (args: { configPath: string; nodeishFs: NodeishFilesystemSubset }) => {
	const { data: configFile, error: configFileError } = await tryCatch(
		async () => await args.nodeishFs.readFile(args.configPath, { encoding: "utf-8" }),
	)
	if (configFileError) throw configFileError // TODO: improve error

	const { data: parsedConfig, error: parseConfigError } = tryCatch(() => JSON.parse(configFile!))
	if (parseConfigError) throw parseConfigError // TODO: improve error

	const typeErrors = [...ConfigCompiler.Errors(parsedConfig)]

	if (typeErrors.length > 0) {
		throw new InvalidConfigError(`The config is invalid according to the schema.`, {
			cause: typeErrors,
		})
	}

	return Value.Cast(InlangConfig, parsedConfig)
}

const loadModules = async (args: {
	config: InlangConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) =>
	resolveModules({
		config: args.config,
		nodeishFs: args.nodeishFs,
		_import: args._import,
	})

const createAwaitable = () => {
	let resolve: () => void

	const promise = new Promise<void>((res) => (resolve = res))

	return [promise, resolve!] as [awaitable: Promise<void>, resolve: () => void]
}

// TODO: create global util type
type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

import type { InlangInstance } from "./api.js"
import { ImportFunction, ResolveModulesFunction, resolveModules } from "@inlang/module"
import { NodeishFilesystemSubset, InlangConfig, Message, tryCatch } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import { InvalidConfigError } from "./errors.js"
import { LintError, LintReport, lintMessages } from "@inlang/lint"
import { createRoot, createSignal, createEffect } from "./solid.js"
import { ReactiveMap } from "@solid-primitives/map"
import { createReactiveQuery } from "./createReactiveQuery.js"

const ConfigCompiler = TypeCompiler.Compile(InlangConfig)

/**
 * Creates an inlang instance.
 *
 * - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 *
 */
export const createInlang = async (args: {
	configPath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}): Promise<InlangInstance> =>
	await createRoot(async () => {
		const [initialized, markInitAsComplete] = createAwaitable()

		// -- config ------------------------------------------------------------

		const [config, setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			loadConfig({ configPath: args.configPath, nodeishFs: args.nodeishFs })
				.then(setConfig)
				.catch((err) => {
					console.error("ERROR IN LOAD CONFIG ", err)
				})
		})
		// TODO: create FS watcher and update config on change

		console.log({ config })

		// -- resolvedModules -----------------------------------------------------------

		const [resolvedModules, setResolvedModules] =
			createSignal<Awaited<ReturnType<ResolveModulesFunction>>>()

		createEffect(() => {
			const conf = config()
			if (!conf) return

			loadModules({ config: conf, nodeishFs: args.nodeishFs, _import: args._import })
				.then((resolvedModules) => {
					setResolvedModules(resolvedModules)
					// TODO: handle `detectedLanguageTags`
				})
				.catch((err) => {
					console.error("ERROR IN LOAD MODULES ", err)
				})
		})
		// -- messages ----------------------------------------------------------

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			console.log("0 effect load messages is triggered")
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return
			//console.log(_resolvedModules.data.plugins.data)
			makeTrulyAsync(
				_resolvedModules.data.plugins.data.loadMessages({ languageTags: config()!.languageTags }),
			)
				.then((messages) => {
					console.log("1 messsages loaded")
					setMessages(messages)

					markInitAsComplete()
				})
				.catch((err) => {
					console.error("3 ERROR IN LOAD MESSAGES ", err)
				})
		})

		const query = createReactiveQuery(() => messages() ?? [])

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
				query,
				rules: resolvedModules()!.data.lintRules.data,
			}).then((report) => {
				setLintReports(report.data)
				setLintErrors(report.errors)

				markLintReportsAsInitialized()
			})
		})

		// -- app ---------------------------------------------------------------

		await initialized

		// createEffect(() => {
		// 	console.log(config())
		// })

		// console.log(resolveModules().data.meta.plugins)

		return {
			meta: {
				plugins: () => resolvedModules()!.data.meta.plugins,
				lintRules: () => resolvedModules()!.data.meta.lintRules,
			},
			errors: {
				module: () => resolvedModules()!.errors,
				plugin: () => resolvedModules()!.data.plugins.errors,
				lintRules: () => [...resolvedModules()!.data.lintRules.errors, ...(lintErrors() || [])],
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
			appSpecificApi: () => resolvedModules()!.data.plugins.data!.appSpecificApi, // TODO: make reactive (using store)
			query: {
				messages: query,
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

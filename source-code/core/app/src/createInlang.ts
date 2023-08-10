import type { InlangInstance } from "./api.js"
import { ImportFunction, ResolveModulesFunction, resolveModules } from "@inlang/module"
import { NodeishFilesystemSubset, InlangConfig, Message, tryCatch } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import { ConfigPathNotFoundError, ConfigSyntaxError, InvalidConfigError } from "./errors.js"
import { LintError, LintReport, lintMessages } from "@inlang/lint"
import { createRoot, createSignal, createEffect, observable } from "./solid.js"
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
}): Promise<InlangInstance> => {
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()

		// -- config ------------------------------------------------------------

		const [config, setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			//console.log("set config internal")
			loadConfig({ configPath: args.configPath, nodeishFs: args.nodeishFs })
				.then(setConfig)
				.catch((err) => {
					console.error("Error in load config ", err)
					markInitAsFailed(err)
				})
		})
		// TODO: create FS watcher and update config on change

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
					console.error("Error in load config ", err)
				})
		})
		// -- messages ----------------------------------------------------------

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			makeTrulyAsync(
				_resolvedModules.data.plugins.data.loadMessages({ languageTags: config()!.languageTags }),
			)
				.then((messages) => {
					setMessages(messages)
					markInitAsComplete()
				})
				.catch((err) => {
					console.error("Error in load messages ", err)
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

		await initialized.catch((e) => {
			throw e
		})

		// createEffect(() => {
		// 	console.log(config())
		// })

		// console.log(resolveModules().data.meta.plugins)

		return {
			meta: {
				plugins: observable(() => resolvedModules()!.data.meta.plugins),
				lintRules: observable(() => resolvedModules()!.data.meta.lintRules),
			},
			errors: {
				module: observable(() => resolvedModules()!.errors),
				plugin: observable(() => resolvedModules()!.data.plugins.errors),
				lintRules: observable(() => [
					...resolvedModules()!.data.lintRules.errors,
					...(lintErrors() || []),
				]),
			},
			config: observable(config),
			setConfig: setConfig,
			lint: {
				init: initLint,
				reports: observable(() => {
					const reports = lintReports()
					// TODO: improve error
					if (!reports) return [] //throw new Error("lint not initialized yet")
					return reports
				}),
			},
			appSpecificApi: observable(() => resolvedModules()!.data.plugins.data!.appSpecificApi), // TODO: make reactive (using store)
			query: {
				messages: query,
			},
		} satisfies InlangInstance
	})
}

const loadConfig = async (args: { configPath: string; nodeishFs: NodeishFilesystemSubset }) => {
	const { data: configFile, error: configFileError } = await tryCatch(
		async () => await args.nodeishFs.readFile(args.configPath, { encoding: "utf-8" }),
	)
	if (configFileError)
		throw new ConfigPathNotFoundError(`Could not locate config file in (${args.configPath}).`, {
			cause: configFileError,
		})

	const { data: parsedConfig, error: parseConfigError } = tryCatch(() => JSON.parse(configFile!))
	if (parseConfigError)
		throw new ConfigSyntaxError(`The config is not a valid JSON file.`, {
			cause: parseConfigError,
		})

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
	let reject: () => void

	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	return [promise, resolve!, reject!] as [
		awaitable: Promise<void>,
		resolve: () => void,
		reject: (e: unknown) => void,
	]
}

// TODO: create global util type
type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

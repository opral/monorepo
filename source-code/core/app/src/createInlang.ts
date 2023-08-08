import type { InlangInstance } from "./api.js"
import { ImportFunction, ResolveModulesFunction, resolveModules } from "@inlang/module"
import { NodeishFilesystemSubset, InlangConfig, createQuery, ResolvedPlugins, Message } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import { InvalidConfigError } from "./errors.js"
import { LintException, LintReport, LintRule, lintMessages } from "@inlang/lint"
import { createRoot, createSignal, createEffect } from './solid.js'

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
		// just for testing // TODO: remove
		if (!args.nodeishFs) return {} as any

		const [initialized, markInitAsComplete] = createAwaitable()

		// -- config ------------------------------------------------------------
		const [config, setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			loadConfig({ configPath: args.configPath, nodeishFs: args.nodeishFs }).then(setConfig)
		})
		// TODO: create FS watcher and update config on change

		// -- modules -----------------------------------------------------------

		const [modules, setModules] = createSignal<Awaited<ReturnType<ResolveModulesFunction>>>()
		createEffect(() => {
			const conf = config()
			if (!conf) return

			loadModules({ config: conf, nodeishFs: args.nodeishFs, _import: args._import }).then(setModules)
		})

		const [plugins, setPlugins] = createSignal<ResolvedPlugins>() // TODO: is `ResolvedPlugins` the correct naming?
		const [lintRules, setLintRules] = createSignal<Pick<LintRule, 'meta'>[]>([])
		createEffect(() => {
			const mods = modules()
			if (!mods) return

			setPlugins(mods.data.plugins.data)
			setLintRules(mods.data.lintRules.data)
		})

		// -- messages ----------------------------------------------------------

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			const plugs = plugins()
			if (!plugs) return
			// TODO: should createInlang already load messages ? I don't think so
			makeTrulyAsync(plugs.loadMessages({ languageTags: ["en"], }))  // TODO: why 'en' and why only 'en'?
				.then((messages) => {
					setMessages(messages)

					markInitAsComplete()
				})
		})

		// const query = createQuery(messages() || []) // TODO: make query reactive

		// -- lint --------------------------------------------------------------

		const [processLints, setProcessLints] = createSignal(false)
		const [lintReportsInitialized, markLintReportsAsInitialized] = createAwaitable()
		const initLint = () => {
			setProcessLints(true)
			return lintReportsInitialized
		}

		const [lintReports, setLintReports] = createSignal<LintReport[]>([])
		const [lintExceptions, setLintExceptions] = createSignal<LintException[]>([])
		createEffect(() => {
			const msgs = messages()
			if (!msgs || !processLints()) return

			// TODO: only lint changed messages and update arrays selectively
			lintMessages({ config: config() as InlangConfig, messages: msgs, query, rules: lintRules() as LintRule[] })
				.then((report) => {
					setLintReports(report.data)
					setLintExceptions(report.errors)
					markLintReportsAsInitialized()
				})
		})

		// -- app ---------------------------------------------------------------

		await initialized

		// TODO: remove workaround and init reactive query above
		const query = createQuery(messages() || [])

		return {
			module: {
				meta: {
					plugins: {},
					lintRules: {},
				},
			},
			config: {
				get: config as () => InlangConfig,
				set: setConfig,
			},
			lint: {
				rules: {
					get: lintRules,
				},
				reports: {
					get: lintReports,
					init: initLint,
				},
				exceptions: {
					get: lintExceptions,
					init: initLint,
				},
			},
			plugins: plugins() as ResolvedPlugins, // TODO: shouldn't this also be reactive?
			messages: {
				query,
			},
		} satisfies InlangInstance
	})
}

const loadConfig = async (args: {
	configPath: string
	nodeishFs: NodeishFilesystemSubset
}) => {
	// TODO #1182 the filesystem type is incorrect. manual type casting is required
	const configFile = (await args.nodeishFs.readFile(args.configPath, { encoding: "utf-8" })) // TODO: this could throw!
	const parsedConfig = JSON.parse(configFile) // TODO: this could throw!
	const typeErrors = [...ConfigCompiler.Errors(parsedConfig)]

	// -- USES INVALID SCHEMA --
	if (typeErrors.length > 0) {
		const errors: Array<InvalidConfigError> = []

		errors.push(
			new InvalidConfigError(`The config is invalid according to the schema.`, {
				cause: errors,
			}),
		)
		// TODO: shouldn't we stop executing here?
	}

	return Value.Cast(InlangConfig, parsedConfig)
}

const loadModules = async (args: {
	config: InlangConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) => resolveModules({
	config: args.config,
	nodeishFs: args.nodeishFs,
	_import: args._import,
})

const createAwaitable = () => {
	let resolve: () => void

	const promise = new Promise<void>((res) => resolve = res)

	return [promise, resolve!] as [awaitable: Promise<void>, resolve: () => void]
}

// TODO: create global util type
type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

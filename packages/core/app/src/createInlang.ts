/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { InlangProject, InstalledLintRule, InstalledPlugin, Subscribable } from "./api.js"
import { ImportFunction, ResolveModulesFunction, resolveModules } from "@inlang/module"
import {
	NodeishFilesystemSubset,
	Message,
	tryCatch,
	Result,
	JSONSerializableObject,
} from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import { ConfigPathNotFoundError, ConfigSyntaxError, InvalidConfigError } from "./errors.js"
import { LintRuleThrowedError, LintReport, lintMessages } from "@inlang/lint"
import { createRoot, createSignal, createEffect } from "./solid.js"
import { createReactiveQuery } from "./createReactiveQuery.js"
import { InlangConfig } from "@inlang/config"

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
}): Promise<InlangProject> => {
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()

		// -- config ------------------------------------------------------------

		const [config, _setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			//console.log("set config internal")
			loadConfig({ configPath: args.configPath, nodeishFs: args.nodeishFs })
				.then((config) => {
					setConfig(config)
				})
				.catch((err) => {
					//console.error("Error in load config ", err)
					markInitAsFailed(err)
				})
		})
		// TODO: create FS watcher and update config on change

		const setConfig = (config: InlangConfig): Result<void, InvalidConfigError> => {
			try {
				const validatedConfig = validateConfig(config)
				_setConfig(validatedConfig)

				writeConfigToDisk({ nodeishFs: args.nodeishFs, config: validatedConfig })
				return { data: undefined }
			} catch (error: unknown) {
				if (error instanceof InvalidConfigError) {
					return { error: error }
				}

				throw new Error("unhandled")
			}
		}

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
					delete err.stack // TODO: find a way to get rid of the filename in the stack trace or else we won't be able to read the actual error message
					console.error("Error in load modules ", err)
				})
		})

		// -- messages ----------------------------------------------------------

		let configValue: InlangConfig
		createEffect(() => (configValue = config()!)) // workaround to not run effects twice (e.g. config change + modules change) (I'm sure there exists a solid way of doing this, but I haven't found it yet)

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			makeTrulyAsync(
				_resolvedModules.runtimePluginApi.loadMessages({
					languageTags: configValue!.languageTags,
				}),
			)
				.then((messages) => {
					setMessages(messages)
					markInitAsComplete()
				})
				.catch((err) => {
					console.error("Error in load messages ", err)
				})
		})

		// -- installed items ----------------------------------------------------

		const installedLintRules = () =>
			resolvedModules()!.lintRules.map(
				(rule) =>
					({
						meta: rule.meta,
						module:
							resolvedModules()?.meta.find((m) => m.lintRules.includes(rule.meta.id))?.module ??
							"Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
						// default to warning, see https://github.com/inlang/inlang/issues/1254
						lintLevel: configValue.settings["project.lintRuleLevels"]?.[rule.meta.id] ?? "warning",
						disabled: configValue.settings["project.disabled"]?.includes(rule.meta.id) ?? false,
					} satisfies InstalledLintRule),
			) satisfies Array<InstalledLintRule>

		const installedPlugins = () =>
			resolvedModules()!.plugins.map((plugin) => ({
				meta: plugin.meta,
				module:
					resolvedModules()?.meta.find((m) => m.plugins.includes(plugin.meta.id))?.module ??
					"Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
			})) satisfies Array<InstalledPlugin>

		// -- lint --------------------------------------------------------------

		const [lintInitialized, setLintInitialized] = createSignal(false)
		const [lintReportsInitialized, markLintReportsAsInitialized] = createAwaitable()
		const initLint = () => {
			setLintInitialized(true)
			return lintReportsInitialized
		}

		const [lintReports, setLintReports] = createSignal<LintReport[]>()
		const [lintErrors, setLintErrors] = createSignal<LintRuleThrowedError[]>([])
		createEffect(() => {
			const msgs = messages()
			if (!msgs || !lintInitialized()) return

			// TODO: only lint changed messages and update arrays selectively
			lintMessages({
				sourceLanguageTag: configValue!.sourceLanguageTag,
				languageTags: configValue!.languageTags,
				lintRuleSettings: configValue!.settings as Record<
					`${string}.lintRule.${string}`,
					JSONSerializableObject
				>,
				lintLevels: Object.fromEntries(
					installedLintRules().map((rule) => [rule.meta.id, rule.lintLevel]),
				),
				messages: msgs,
				rules:
					configValue.settings["project.disabled"] !== undefined
						? resolvedModules()!.lintRules.filter(
								(rule) =>
									configValue.settings["project.disabled"]?.includes(rule.meta.id) === false,
						  )
						: resolvedModules()!.lintRules,
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

		const query = createReactiveQuery(() => messages()!)

		return {
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				lintRules: createSubscribable(() => installedLintRules()),
			},
			errors: createSubscribable(() => [...resolvedModules()!.errors, ...(lintErrors() ?? [])]),
			config: createSubscribable(() => config()!),
			setConfig,
			lint: {
				init: initLint,
				reports: createSubscribable(() => {
					const reports = lintReports()
					// TODO: improve error
					if (!reports) return []
					return reports
				}),
			},
			appSpecificApi: createSubscribable(() => resolvedModules()!.runtimePluginApi.appSpecificApi),
			query: {
				messages: query,
			},
		} satisfies InlangProject
	})
}

// ------------------------------------------------------------------------------------------------

const loadConfig = async (args: { configPath: string; nodeishFs: NodeishFilesystemSubset }) => {
	let json: JSON
	if (args.configPath.startsWith("data:")) {
		json = (await import(args.configPath)).default
		// TODO: add error handling
	} else {
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

		json = parsedConfig
	}

	return validateConfig(json)
}

const validateConfig = (config: JSONObject) => {
	const typeErrors = [...ConfigCompiler.Errors(config)]
	if (typeErrors.length > 0) {
		throw new InvalidConfigError(`The config is invalid according to the schema.`, {
			cause: typeErrors,
		})
	}

	return Value.Cast(InlangConfig, config)
}

const writeConfigToDisk = async (args: {
	nodeishFs: NodeishFilesystemSubset
	config: InlangConfig
}) => {
	const { data: serializedConfig, error: serializeConfigError } = tryCatch(() =>
		// TODO: this will probably not match the original formatting
		JSON.stringify(args.config, undefined, 2),
	)
	if (serializeConfigError) throw serializeConfigError

	const { error: writeConfigError } = await tryCatch(async () =>
		args.nodeishFs.writeFile("./inlang.config.json", serializedConfig!),
	)
	if (writeConfigError) throw writeConfigError
}

// ------------------------------------------------------------------------------------------------

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

// ------------------------------------------------------------------------------------------------

// TODO: define better type
type JSONObject = any

// TODO: create global util type
type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

// TODO: how do we unsubscribe? Do we need that?
// COMMENT from @samuelstroschein: Likely not. The reactivity is handled internally with auto dispose from SolidJS.
function createSubscribable<T>(signal: () => T): Subscribable<T> {
	return Object.assign(signal, {
		subscribe: (callback: any) => {
			createEffect(() => {
				callback(signal())
			})
		},
	})
}

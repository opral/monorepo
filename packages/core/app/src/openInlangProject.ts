/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { InlangProject, InstalledLintRule, InstalledPlugin, Subscribable } from "./api.js"
import { type ImportFunction, type ResolvePackagesFunction, resolvePackages } from "@inlang/package"
import { NodeishFilesystemSubset, Message, tryCatch, Result } from "@inlang/plugin"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { Value } from "@sinclair/typebox/value"
import {
	ProjectFilePathNotFoundError,
	ProjectFileJSONSyntaxError,
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"
import { createRoot, createSignal, createEffect } from "./solid.js"
import { createMessagesQuery } from "./createMessagesQuery.js"
import { InlangConfig } from "@inlang/config"
import { debounce } from "throttle-debounce"
import { createLintReportsQuery } from "./createLintReportsQuery.js"

const ConfigCompiler = TypeCompiler.Compile(InlangConfig)

/**
 * Creates an inlang instance.
 *
 * - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedPackages such as CJS.
 *
 */
export const openInlangProject = async (args: {
	projectFilePath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}): Promise<InlangProject> => {
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()

		// -- config ------------------------------------------------------------

		const [config, _setConfig] = createSignal<InlangConfig>()
		createEffect(() => {
			loadConfig({ projectFilePath: args.projectFilePath, nodeishFs: args.nodeishFs })
				.then((config) => {
					setConfig(config)
				})
				.catch((err) => {
					markInitAsFailed(err)
				})
		})
		// TODO: create FS watcher and update config on change

		const writeConfigToDisk = skipFirst((config: InlangConfig) =>
			_writeConfigToDisk({ nodeishFs: args.nodeishFs, config }),
		)

		const setConfig = (config: InlangConfig): Result<void, InvalidConfigError> => {
			try {
				const validatedConfig = validateConfig(config)
				_setConfig(validatedConfig)

				writeConfigToDisk(validatedConfig)
				return { data: undefined }
			} catch (error: unknown) {
				if (error instanceof InvalidConfigError) {
					return { error }
				}

				throw new Error("unhandled")
			}
		}

		// -- resolvedPackages -----------------------------------------------------------

		const [resolvedPackages, setResolvedPackages] =
			createSignal<Awaited<ReturnType<ResolvePackagesFunction>>>()

		createEffect(() => {
			const conf = config()
			if (!conf) return

			loadPackages({ config: conf, nodeishFs: args.nodeishFs, _import: args._import })
				.then((resolvedPackages) => {
					if (
						!resolvedPackages.resolvedPluginApi.loadMessages ||
						!resolvedPackages.resolvedPluginApi.saveMessages
					) {
						throw new NoPluginProvidesLoadOrSaveMessagesError()
					}
					setResolvedPackages(resolvedPackages)

					// TODO: handle `detectedLanguageTags`
				})
				.catch((err) => markInitAsFailed(err))
		})

		// -- messages ----------------------------------------------------------

		let configValue: InlangConfig
		createEffect(() => (configValue = config()!)) // workaround to not run effects twice (e.g. config change + packages change) (I'm sure there exists a solid way of doing this, but I haven't found it yet)

		const [messages, setMessages] = createSignal<Message[]>()
		createEffect(() => {
			const conf = config()
			if (!conf) return

			const _resolvedPackages = resolvedPackages()
			if (!_resolvedPackages) return

			if (!_resolvedPackages.resolvedPluginApi.loadMessages) {
				markInitAsFailed(undefined)
				return
			}

			makeTrulyAsync(
				_resolvedPackages.resolvedPluginApi.loadMessages({
					languageTags: configValue!.languageTags,
				}),
			)
				.then((messages) => {
					setMessages(messages)
					markInitAsComplete()
				})
				.catch((err) =>
					markInitAsFailed(new PluginLoadMessagesError("Error in load messages", { cause: err })),
				)
		})

		// -- installed items ----------------------------------------------------

		const installedLintRules = () => {
			if (!resolvedPackages()) return []
			return resolvedPackages()!.lintRules.map(
				(rule) =>
					({
						meta: rule.meta,
						package:
							resolvedPackages()?.meta.find((m) => m.lintRules.includes(rule.meta.id))?.package ??
							"Unknown package. You stumbled on a bug in inlang's source code. Please open an issue.",
						// default to warning, see https://github.com/inlang/inlang/issues/1254
						lintLevel: configValue.settings["project.lintRuleLevels"]?.[rule.meta.id] ?? "warning",
						disabled: configValue.settings["project.disabled"]?.includes(rule.meta.id) ?? false,
					} satisfies InstalledLintRule),
			) satisfies Array<InstalledLintRule>
		}

		const installedPlugins = () => {
			if (!resolvedPackages()) return []
			return resolvedPackages()!.plugins.map((plugin) => ({
				meta: plugin.meta,
				package:
					resolvedPackages()?.meta.find((m) => m.plugins.includes(plugin.meta.id))?.package ??
					"Unknown package. You stumbled on a bug in inlang's source code. Please open an issue.",
			})) satisfies Array<InstalledPlugin>
		}

		// -- app ---------------------------------------------------------------

		const initializeError: Error | undefined = await initialized.catch((error) => error)

		const messagesQuery = createMessagesQuery(() => messages() || [])
		const lintReportsQuery = createLintReportsQuery(
			messagesQuery.getAll,
			config,
			installedLintRules,
			resolvedPackages,
		)

		const debouncedSave = skipFirst(
			debounce(
				500,
				async (newMessages) => {
					try {
						await resolvedPackages()!.resolvedPluginApi.saveMessages({ messages: newMessages })
					} catch (err) {
						throw new PluginSaveMessagesError("Error in saving messages", {
							cause: err,
						})
					}
					// if (
					// 	newMessages.length !== 0 &&
					// 	JSON.stringify(newMessages) !== JSON.stringify(messages())
					// ) {
					// 	setMessages(newMessages)
					// }
				},
				{ atBegin: false },
			),
		)

		createEffect(() => {
			debouncedSave(messagesQuery.getAll())
		})

		return {
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				lintRules: createSubscribable(() => installedLintRules()),
			},
			errors: createSubscribable(() => [
				...(initializeError ? [initializeError] : []),
				...(resolvedPackages() ? resolvedPackages()!.errors : []),
				// have a query error exposed
				//...(lintErrors() ?? []),
			]),
			config: createSubscribable(() => config()),
			setConfig,
			appSpecificApi: createSubscribable(
				() => resolvedPackages()?.resolvedPluginApi.appSpecificApi || {},
			),
			query: {
				messages: messagesQuery,
				lintReports: lintReportsQuery,
			},
		} satisfies InlangProject
	})
}

//const x = {} as InlangProject

// ------------------------------------------------------------------------------------------------

const loadConfig = async (args: {
	projectFilePath: string
	nodeishFs: NodeishFilesystemSubset
}) => {
	let json: JSON
	if (args.projectFilePath.startsWith("data:")) {
		json = (await import(/* @vite-ignore */ args.projectFilePath)).default
		// TODO: add error handling
	} else {
		const { data: configFile, error: configFileError } = await tryCatch(
			async () => await args.nodeishFs.readFile(args.projectFilePath, { encoding: "utf-8" }),
		)
		if (configFileError)
			throw new ProjectFilePathNotFoundError(
				`Could not locate config file in (${args.projectFilePath}).`,
				{
					cause: configFileError,
				},
			)

		const { data: parsedConfig, error: parseConfigError } = tryCatch(() => JSON.parse(configFile!))
		if (parseConfigError)
			throw new ProjectFileJSONSyntaxError(`The config is not a valid JSON file.`, {
				cause: parseConfigError,
			})

		json = parsedConfig
	}
	return validateConfig(json)
}

const validateConfig = (config: unknown) => {
	const typeErrors = [...ConfigCompiler.Errors(config)]
	if (typeErrors.length > 0) {
		throw new InvalidConfigError(`The config is invalid according to the schema.`, {
			cause: typeErrors,
		})
	}

	return Value.Cast(InlangConfig, config)
}

const _writeConfigToDisk = async (args: {
	nodeishFs: NodeishFilesystemSubset
	config: InlangConfig
}) => {
	const { data: serializedConfig, error: serializeConfigError } = tryCatch(() =>
		// TODO: this will probably not match the original formatting
		JSON.stringify(args.config, undefined, 2),
	)
	if (serializeConfigError) throw serializeConfigError

	const { error: writeConfigError } = await tryCatch(async () =>
		args.nodeishFs.writeFile("./project.inlang.json", serializedConfig!),
	)
	if (writeConfigError) throw writeConfigError
}

// ------------------------------------------------------------------------------------------------

const loadPackages = async (args: {
	config: InlangConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) =>
	resolvePackages({
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

// TODO: create global util type
type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

// Skip initial call, eg. to skip setup of a createEffect
function skipFirst(func: (args: any) => any) {
	let initial = false
	return function (...args: any) {
		if (initial) {
			// @ts-ignore
			return func.apply(this, args)
		}
		initial = true
	}
}

export function createSubscribable<T>(signal: () => T): Subscribable<T> {
	return Object.assign(signal, {
		subscribe: (callback: (value: T) => void) => {
			createEffect(() => {
				callback(signal())
			})
		},
	})
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
	InlangProject,
	InstalledMessageLintRule,
	InstalledPlugin,
	Subscribable,
} from "./api.js"
import { type ImportFunction, resolveModules } from "./resolve-modules/index.js"
import { TypeCompiler, ValueErrorType } from "@sinclair/typebox/compiler"
import {
	ProjectSettingsFileJSONSyntaxError,
	ProjectSettingsFileNotFoundError,
	ProjectSettingsInvalidError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
	LoadProjectInvalidArgument,
} from "./errors.js"
import { createRoot, createSignal, createEffect } from "./reactivity/solid.js"
import { createMessagesQuery } from "./createMessagesQuery.js"
import { debounce } from "throttle-debounce"
import { createMessageLintReportsQuery } from "./createMessageLintReportsQuery.js"
import { ProjectSettings, Message, type NodeishFilesystemSubset } from "./versionedInterfaces.js"
import { tryCatch, type Result } from "@inlang/result"
import { migrateIfOutdated } from "@inlang/project-settings/migration"
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js"
import { normalizePath } from "@lix-js/fs"
import { isAbsolutePath } from "./isAbsolutePath.js"

const settingsCompiler = TypeCompiler.Compile(ProjectSettings)

/**
 * Creates an inlang instance.
 *
 * @param settingsFilePath - Absolute path to the inlang settings file.
 * @param nodeishFs - Filesystem that implements the NodeishFilesystemSubset interface.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 * @param _capture - Use `_capture` to capture events for analytics.
 *
 */
export const loadProject = async (args: {
	settingsFilePath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
	_capture?: (id: string, props: Record<string, unknown>) => void
}): Promise<InlangProject> => {
	// -- validation --------------------------------------------------------
	//! the only place where throwing is acceptable because the project
	//! won't even be loaded. do not throw anywhere else. otherwise, apps
	//! can't handle errors gracefully.
	if (!isAbsolutePath(args.settingsFilePath)) {
		throw new LoadProjectInvalidArgument(
			`Expected an absolute path but received "${args.settingsFilePath}".`,
			{ argument: "settingsFilePath" }
		)
	}

	const settingsFilePath = normalizePath(args.settingsFilePath)

	// -- load project ------------------------------------------------------
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()
		const nodeishFs = createNodeishFsWithAbsolutePaths({
			settingsFilePath,
			nodeishFs: args.nodeishFs,
		})

		// const abortController = new AbortController()

		// (async () => {
		// 	const watcher = nodeishFs.watch(path.join('..', settingsFilePath), { signal: abortController.signal, recursive: true })
		// 	for await (event of watcher) {
		//	  if match event.filename else ignore
		// 		// reload
		// 	}
		// } catch (err) {d
		// 	if ((err.name = "AbortError")) {
		// 	}
		// }()

		// abortController.abort()

		// -- settings ------------------------------------------------------------

		const [settings, _setSettings] = createSignal<ProjectSettings>()
		createEffect(() => {
			loadSettings({ settingsFilePath, nodeishFs })
				.then((settings) => {
					setSettings(settings)
					// rename settings to get a convenient access to the data in Posthog
					const project_settings = settings
					args._capture?.("SDK used settings", { project_settings })
				})
				.catch((err) => {
					markInitAsFailed(err)
				})
		})
		// TODO: create FS watcher and update settings on change

		const writeSettingsToDisk = skipFirst((settings: ProjectSettings) =>
			_writeSettingsToDisk({ nodeishFs, settings })
		)

		const setSettings = (settings: ProjectSettings): Result<void, ProjectSettingsInvalidError> => {
			try {
				const validatedSettings = parseSettings(settings)
				_setSettings(validatedSettings)

				writeSettingsToDisk(validatedSettings)
				return { data: undefined }
			} catch (error: unknown) {
				if (error instanceof ProjectSettingsInvalidError) {
					return { error }
				}

				throw new Error(
					"Unhandled error in setSettings. This is an internal bug. Please file an issue."
				)
			}
		}

		// -- resolvedModules -----------------------------------------------------------

		const [resolvedModules, setResolvedModules] =
			createSignal<Awaited<ReturnType<typeof resolveModules>>>()

		createEffect(() => {
			const _settings = settings()
			if (!_settings) return

			resolveModules({ settings: _settings, nodeishFs, _import: args._import })
				.then((resolvedModules) => {
					setResolvedModules(resolvedModules)
				})
				.catch((err) => markInitAsFailed(err))
		})

		// -- messages ----------------------------------------------------------

		let settingsValue: ProjectSettings
		createEffect(() => (settingsValue = settings()!)) // workaround to not run effects twice (e.g. settings change + modules change) (I'm sure there exists a solid way of doing this, but I haven't found it yet)

		const [messages, setMessages] = createSignal<Message[]>()

		createEffect(() => {
			const conf = settings()
			if (!conf) return

			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			if (!_resolvedModules.resolvedPluginApi.loadMessages) {
				markInitAsFailed(undefined)
				return
			}

			const loadAndSetMessages = async () => {
				makeTrulyAsync(
					_resolvedModules.resolvedPluginApi.loadMessages({
						settings: settingsValue,
					})
				)
					.then((messages) => {
						setMessages(messages)
						markInitAsComplete()
					})
					.catch((err) => markInitAsFailed(new PluginLoadMessagesError({ cause: err })))
			}

			loadAndSetMessages()

			const abortController = new AbortController()
			if (Object.keys(settingsValue).includes("plugin.inlang.messageFormat")) {
				;(async () => {
					try {
						const watcher = nodeishFs.watch(
							settingsValue["plugin.inlang.messageFormat"]!.filePath as string,
							{
								signal: abortController.signal,
							}
						)
						//eslint-disable-next-line @typescript-eslint/no-unused-vars
						for await (const event of watcher) {
							loadAndSetMessages()
						}
					} catch (err: any) {
						if (err.name === "AbortError") return
						throw err
					}
				})()
			}
		})

		// -- installed items ----------------------------------------------------

		const installedMessageLintRules = () => {
			if (!resolvedModules()) return []
			return resolvedModules()!.messageLintRules.map(
				(rule) =>
					({
						id: rule.id,
						displayName: rule.displayName,
						description: rule.description,
						module:
							resolvedModules()?.meta.find((m) => m.id.includes(rule.id))?.module ??
							"Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
						// default to warning, see https://github.com/inlang/monorepo/issues/1254
						level: settingsValue["messageLintRuleLevels"]?.[rule.id] ?? "warning",
					} satisfies InstalledMessageLintRule)
			) satisfies Array<InstalledMessageLintRule>
		}

		const installedPlugins = () => {
			if (!resolvedModules()) return []
			return resolvedModules()!.plugins.map((plugin) => ({
				id: plugin.id,
				displayName: plugin.displayName,
				description: plugin.description,
				module:
					resolvedModules()?.meta.find((m) => m.id.includes(plugin.id))?.module ??
					"Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
			})) satisfies Array<InstalledPlugin>
		}

		// -- app ---------------------------------------------------------------

		const initializeError: Error | undefined = await initialized.catch((error) => error)

		const messagesQuery = createMessagesQuery(() => messages() || [])
		const lintReportsQuery = createMessageLintReportsQuery(
			messages,
			settings as () => ProjectSettings,
			installedMessageLintRules,
			resolvedModules
		)

		const debouncedSave = skipFirst(
			debounce(
				500,
				async (newMessages) => {
					try {
						await resolvedModules()?.resolvedPluginApi.saveMessages({
							settings: settingsValue,
							messages: newMessages,
						})
					} catch (err) {
						throw new PluginSaveMessagesError({
							cause: err,
						})
					}
					if (
						newMessages.length !== 0 &&
						JSON.stringify(newMessages) !== JSON.stringify(messages())
					) {
						setMessages(newMessages)
					}
				},
				{ atBegin: false }
			)
		)

		createEffect(() => {
			debouncedSave(messagesQuery.getAll())
		})

		return {
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				messageLintRules: createSubscribable(() => installedMessageLintRules()),
			},
			errors: createSubscribable(() => [
				...(initializeError ? [initializeError] : []),
				...(resolvedModules() ? resolvedModules()!.errors : []),
				// have a query error exposed
				//...(lintErrors() ?? []),
			]),
			settings: createSubscribable(() => settings() as ProjectSettings),
			setSettings,
			customApi: createSubscribable(() => resolvedModules()?.resolvedPluginApi.customApi || {}),
			query: {
				messages: messagesQuery,
				messageLintReports: lintReportsQuery,
			},
		} satisfies InlangProject
	})
}

//const x = {} as InlangProject

// ------------------------------------------------------------------------------------------------

const loadSettings = async (args: {
	settingsFilePath: string
	nodeishFs: NodeishFilesystemSubset
}) => {
	const { data: settingsFile, error: settingsFileError } = await tryCatch(
		async () => await args.nodeishFs.readFile(args.settingsFilePath, { encoding: "utf-8" })
	)
	if (settingsFileError)
		throw new ProjectSettingsFileNotFoundError({
			cause: settingsFileError,
			path: args.settingsFilePath,
		})

	const json = tryCatch(() => JSON.parse(settingsFile!))

	if (json.error) {
		throw new ProjectSettingsFileJSONSyntaxError({
			cause: json.error,
			path: args.settingsFilePath,
		})
	}
	return parseSettings(json.data)
}

const parseSettings = (settings: unknown) => {
	const withMigration = migrateIfOutdated(settings as any)
	if (settingsCompiler.Check(withMigration) === false) {
		const typeErrors = [...settingsCompiler.Errors(settings)]
		if (typeErrors.length > 0) {
			throw new ProjectSettingsInvalidError({
				errors: typeErrors,
			})
		}
	}

	const { sourceLanguageTag, languageTags } = settings as ProjectSettings
	if (!languageTags.includes(sourceLanguageTag)) {
		throw new ProjectSettingsInvalidError({
			errors: [
				{
					message: `The sourceLanguageTag "${sourceLanguageTag}" is not included in the languageTags "${languageTags.join(
						'", "'
					)}". Please add it to the languageTags.`,
					type: ValueErrorType.String,
					schema: ProjectSettings,
					value: sourceLanguageTag,
					path: "sourceLanguageTag",
				},
			],
		})
	}

	return withMigration
}

const _writeSettingsToDisk = async (args: {
	nodeishFs: NodeishFilesystemSubset
	settings: ProjectSettings
}) => {
	const { data: serializedSettings, error: serializeSettingsError } = tryCatch(() =>
		// TODO: this will probably not match the original formatting
		JSON.stringify(args.settings, undefined, 2)
	)
	if (serializeSettingsError) {
		throw serializeSettingsError
	}

	const { error: writeSettingsError } = await tryCatch(async () =>
		args.nodeishFs.writeFile("./project.inlang.json", serializedSettings)
	)

	if (writeSettingsError) {
		throw writeSettingsError
	}
}

// ------------------------------------------------------------------------------------------------

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
		reject: (e: unknown) => void
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

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
	LoadMessageError,
	SaveMessageError,
} from "./errors.js"
import { createRoot, createSignal, createEffect } from "./reactivity/solid.js"
import { createMessagesQuery } from "./createMessagesQuery.js"
import { createMessageLintReportsQuery } from "./createMessageLintReportsQuery.js"
import { ProjectSettings, Message, type NodeishFilesystemSubset } from "./versionedInterfaces.js"
import { tryCatch, type Result } from "@inlang/result"
import { migrateIfOutdated } from "@inlang/project-settings/migration"
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js"
import { normalizePath, type NodeishFilesystem, getDirname } from "@lix-js/fs"
import { isAbsolutePath } from "./isAbsolutePath.js"
import { maybeMigrateToDirectory } from "./migrations/migrateToDirectory.js"

import {
	getMessageIdFromPath,
	getPathFromMessageId,
	parseMessage,
	stringifyMessage as stringifyMessage,
} from "./storage/helper.js"

import { humanIdHash } from "./storage/human-id/human-readable-id.js"

import type { Repository } from "@lix-js/client"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"

import { maybeCreateFirstProjectId } from "./migrations/maybeCreateFirstProjectId.js"

import { capture } from "./telemetry/capture.js"

const settingsCompiler = TypeCompiler.Compile(ProjectSettings)

/**
 * Creates an inlang instance.
 *
 * @param projectPath - Absolute path to the inlang settings file.
 * @param @deprecated nodeishFs - Filesystem that implements the NodeishFilesystemSubset interface.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 *
 */
export async function loadProject(args: {
	projectPath: string
	nodeishFs: Repository["nodeishFs"]
	/**
	 * The app id is used to identify the app that is using the SDK.
	 *
	 * We use the app id to group events in telemetry to answer questions
	 * like "Which apps causes these errors?" or "Which apps are used more than others?".
	 *
	 * @example
	 * 	appId: "app.inlang.badge"
	 */
	appId?: string
	_import?: ImportFunction
}): Promise<InlangProject>

/**
 * @param projectPath - Absolute path to the inlang settings file.
 * @param repo - An instance of a lix repo as returned by `openRepository`.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 *
 */
export async function loadProject(args: {
	projectPath: string
	repo: Repository
	appId?: string
	_import?: ImportFunction
}): Promise<InlangProject>

export async function loadProject(args: {
	projectPath: string
	repo?: Repository
	appId?: string
	_import?: ImportFunction
	nodeishFs?: Repository["nodeishFs"]
}): Promise<InlangProject> {
	const projectPath = normalizePath(args.projectPath)

	// -- validation --------------------------------------------------------
	// the only place where throwing is acceptable because the project
	// won't even be loaded. do not throw anywhere else. otherwise, apps
	// can't handle errors gracefully.

	if (!isAbsolutePath(args.projectPath)) {
		throw new LoadProjectInvalidArgument(
			`Expected an absolute path but received "${args.projectPath}".`,
			{ argument: "projectPath" }
		)
	} else if (/[^\\/]+\.inlang$/.test(projectPath) === false) {
		throw new LoadProjectInvalidArgument(
			`Expected a path ending in "{name}.inlang" but received "${projectPath}".\n\nValid examples: \n- "/path/to/micky-mouse.inlang"\n- "/path/to/green-elephant.inlang\n`,
			{ argument: "projectPath" }
		)
	}

	let fs: Repository["nodeishFs"]
	if (args.nodeishFs) {
		// TODO: deprecate
		fs = args.nodeishFs
	} else if (args.repo) {
		fs = args.repo.nodeishFs
	} else {
		throw new LoadProjectInvalidArgument(`Repo missing from arguments.`, { argument: "repo" })
	}

	const nodeishFs = createNodeishFsWithAbsolutePaths({
		projectPath,
		nodeishFs: fs,
	})

	// -- migratations ------------------------------------------------

	await maybeMigrateToDirectory({ nodeishFs: fs, projectPath })
	await maybeCreateFirstProjectId({ projectPath, repo: args.repo })

	// -- load project ------------------------------------------------------

	return await createRoot(async () => {
		// TODO remove tryCatch after https://github.com/opral/monorepo/issues/2013
		// - a repo will always be present
		// - if a repo is present, the project id will always be present
		const { data: projectId } = await tryCatch(() =>
			fs.readFile(args.projectPath + "/project_id", { encoding: "utf-8" })
		)

		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()
		// -- settings ------------------------------------------------------------

		const [settings, _setSettings] = createSignal<ProjectSettings>()
		createEffect(() => {
			// TODO:
			// if (projectId) {
			// 	telemetryBrowser.group("project", projectId, {
			// 		name: projectId,
			// 	})
			// }

			loadSettings({ settingsFilePath: projectPath + "/settings.json", nodeishFs })
				.then((settings) => setSettings(settings))
				.catch((err) => {
					markInitAsFailed(err)
				})
		})
		// TODO: create FS watcher and update settings on change

		const writeSettingsToDisk = skipFirst((settings: ProjectSettings) =>
			_writeSettingsToDisk({ nodeishFs, settings, projectPath })
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

		// please don't use this as source of truth, use the query instead
		// needed for granular linting
		const [messages, setMessages] = createSignal<Message[]>()

		const [messageLoadErrors, setMessageLoadErrors] = createSignal<{
			[messageId: string]: Error
		}>({})

		const [messageSaveErrors, setMessageSaveErrors] = createSignal<{
			[messageId: string]: Error
		}>({})

		const messageFolderPath = projectPath + "/messages" + "/v1"

		createEffect(() => {
			// wait for first effect excution until modules are resolved
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			// -- initial load of all messages found in the messages folder ----------
			const loadAndSetMessages = async (fs: NodeishFilesystemSubset) => {
				const loadedMessages: Message[] = []

				try {
					// make sure the message folder exists within the .inlang folder
					try {
						await fs.mkdir(messageFolderPath, { recursive: true })
					} catch (e) {
						if ((e as any).code !== "EEXIST") {
							throw e
						}
					}

					// helper function that traverses recursivly through the tree
					const readFilesFromFolderRecursive = async (
						fileSystem: NodeishFilesystemSubset,
						rootPath: string,
						pathToRead: string
					) => {
						let filePaths: string[] = []
						const paths = await fileSystem.readdir(rootPath + pathToRead)
						for (const path of paths) {
							// TODO #1844 CLEARIFY Felix FILESYSTEM - what is inlangs best practice to handle other file systems atm?
							const stat = await fileSystem.stat(rootPath + pathToRead + "/" + path)

							if (stat.isDirectory()) {
								const subfolderPaths = await readFilesFromFolderRecursive(
									fileSystem,
									rootPath,
									// TODO #1844 CLEARIFY Felix FILESYSTEM - what is inlangs best practice to handle other file systems atm?
									pathToRead + "/" + path
								)
								filePaths = filePaths.concat(subfolderPaths)
							} else {
								// TODO #1844 CLEARIFY Felix FILESYSTEM - what is inlangs best practice to handle other file systems atm?
								filePaths.push(pathToRead + "/" + path)
							}
						}
						return filePaths
					}

					const messageFilePaths = await readFilesFromFolderRecursive(fs, messageFolderPath, "")
					for (const messageFilePath of messageFilePaths) {
						const messageId = getMessageIdFromPath(messageFilePath)
						if (!messageId) {
							// ignore files not matching the expected id file path
							continue
						}
						try {
							const messageRaw = await fs.readFile(`${messageFolderPath}${messageFilePath}`, {
								encoding: "utf-8",
							})

							const message = parseMessage(messageFilePath, messageRaw) as Message

							// if we end up here - message parsing was successfull remove entry in erros map if it exists
							const _messageLoadErrors = { ...messageLoadErrors() }
							delete _messageLoadErrors[messageId]
							setMessageLoadErrors(messageLoadErrors)

							loadedMessages.push(message)
						} catch (e) {
							// TODO #1844 FINK - test errors being propagated - fink doesnt show errors other than lints at the moment... -> move to new issue
							// if reading of a single message fails we propagate the error to the project errors
							messageLoadErrors()[messageId] = new LoadMessageError({
								path: messageFilePath,
								messageId,
								cause: e,
							})
							setMessageLoadErrors(messageLoadErrors)
						}
					}

					setMessages(loadedMessages)

					markInitAsComplete()
				} catch (err) {
					markInitAsFailed(new PluginLoadMessagesError({ cause: err }))
				}
			}

			// -- subsequencial upsers and delete of messages on file changes ------------
			loadAndSetMessages(nodeishFs).then(() => {
				// when initial message loading is done start watching on file changes in the message dir
				;(async () => {
					try {
						// NOTE: We dont use the abortController at the moment - this is the same for the SDK everywhere atm.
						// const abortController = new AbortController()
						const watcher = nodeishFs.watch(messageFolderPath, {
							// signal: abortController.signal,
							persistent: false,
							recursive: true,
						})
						if (watcher) {
							//eslint-disable-next-line @typescript-eslint/no-unused-vars
							for await (const event of watcher) {
								if (!event.filename) {
									throw new Error("filename not set in event...")
								}

								const messageId = getMessageIdFromPath(event.filename)
								if (!messageId) {
									// ignore files not matching the expected id file path
									continue
								}

								let fileContent: string | undefined
								try {
									fileContent = await nodeishFs.readFile(messageFolderPath + "/" + event.filename, {
										encoding: "utf-8",
									})
								} catch (e) {
									// check for file not exists error (expected in case of deletion of a message) rethrow on everything else
									if ((e as any).code !== "ENOENT") {
										throw e
									}
								}

								if (!fileContent) {
									// file was deleted - drop the corresponding message
									messagesQuery.delete({ where: { id: messageId } })
								} else {
									try {
										const message = parseMessage(event.filename, fileContent)

										// if we end up here - message parsing was successfull remove entry in erros map if it exists
										const _messageLoadErrors = messageLoadErrors()
										delete _messageLoadErrors[messageId]
										setMessageLoadErrors(_messageLoadErrors)

										const currentMessage = messagesQuery.get({ where: { id: messageId } })
										const currentMessageStringified = stringifyMessage(currentMessage)
										if (currentMessage && currentMessageStringified === fileContent) {
											continue
										}

										messagesQuery.upsert({ where: { id: messageId }, data: message })
									} catch (e) {
										// TODO #1844 FINK - test errors being propagated - fink doesnt show errors other than lints at the moment... -> move to new issue
										messageLoadErrors()[messageId] = new LoadMessageError({
											path: messageFolderPath + "/" + event.filename,
											messageId,
											cause: e,
										})
										setMessageLoadErrors(messageLoadErrors)
									}
								}
							}
						}
					} catch (err: any) {
						if (err.name === "AbortError") return
						throw err
					}
				})()
			})
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
						// default to warning, see https://github.com/opral/monorepo/issues/1254
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

		const abortController = new AbortController()
		const hasWatcher = nodeishFs.watch("/", { signal: abortController.signal }) !== undefined

		const messagesQuery = createMessagesQuery(() => messages() || [])

		const trackedMessages: Map<string, () => void> = new Map()
		let initialSetup = true
		// -- subscribe to all messages and write to files on signal -------------
		createEffect(() => {
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			const currentMessageIds = messagesQuery.includedMessageIds()
			const deletedMessageTrackedMessage = [...trackedMessages].filter(
				(tracked) => !currentMessageIds.includes(tracked[0])
			)

			const saveMessagesPlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.saveMessages !== undefined
			)

			// TODO #1844 add reasoning behind salting of project id -> move to new issue
			for (const messageId of currentMessageIds) {
				if (!trackedMessages!.has(messageId!)) {
					// we create a new root to be able to cleanup an effect for a message the got deleted
					createRoot((dispose) => {
						createEffect(() => {
							const message = messagesQuery.get({ where: { id: messageId } })!
							if (!message) {
								return
							}
							if (!trackedMessages?.has(messageId)) {
								// initial effect execution - add dispose function
								trackedMessages?.set(messageId, dispose)
							}

							if (!initialSetup) {
								const persistMessage = async (
									fs: NodeishFilesystemSubset,
									path: string,
									message: Message
								) => {
									let dir = getDirname(path)
									dir = dir.endsWith("/") ? dir.slice(0, -1) : dir

									try {
										await fs.mkdir(dir, { recursive: true })
									} catch (e) {
										if ((e as any).code !== "EEXIST") {
											throw e
										}
									}

									await fs.writeFile(path, stringifyMessage(message))

									// TODO #1844 we don't wait for the file to be persisted - investigate could this become a problem when we batch update messages
									saveMessages(fs, messagesQuery, settings()!, saveMessagesPlugin)
									// debouncedSave(messagesQuery.getAll())
								}
								const messageFilePath = messageFolderPath + "/" + getPathFromMessageId(message.id)
								persistMessage(nodeishFs, messageFilePath, message)
									.then(() => {
										const _messageSaveErrors = messageSaveErrors()
										delete _messageSaveErrors[messageId]
										setMessageLoadErrors(_messageSaveErrors)
									})
									.catch((error) => {
										// TODO #1844 FINK - test if errors get propagated -> move to new issue
										// in case saving didn't work (problem during serialization or saving to file) - add to message error array in project
										messageSaveErrors()[messageId] = new SaveMessageError({
											path: messageFilePath,
											messageId,
											cause: error,
										})
										setMessageSaveErrors(messageLoadErrors)
									})
							}
						})
					})
				}
			}

			for (const deletedMessage of deletedMessageTrackedMessage) {
				const messageFilePath = messageFolderPath + "/" + getPathFromMessageId(deletedMessage[0])
				try {
					nodeishFs.rm(messageFilePath)
					// TODO #1844 we don't wait for the file to be persisted - investigate could this become a problem when we batch update messages
					saveMessages(nodeishFs, messagesQuery, settings()!, saveMessagesPlugin)
				} catch (e) {
					if ((e as any).code !== "ENOENT") {
						throw e
					}
				}
				// dispose
				trackedMessages.get(deletedMessage[0])?.()
				trackedMessages.delete(deletedMessage[0])
			}

			initialSetup = false
		})

		// run import
		const _resolvedModules = resolvedModules()
		const _settings = settings()

		const fsWithWatcher = createNodeishFsWithWatcher({
			nodeishFs: nodeishFs,
			updateMessages: () => {
				// NOTE the current solution does not watch on deletion or creation of a file (if one adds de.json in case of the json plugin we wont recognize this until restart)
				if (_resolvedModules?.resolvedPluginApi.loadMessages && _settings) {
					// get plugin finding the plugin that provides loadMessages function
					const loadMessagePlugin = _resolvedModules.plugins.find(
						(plugin) => plugin.loadMessages !== undefined
					)

					// TODO #1844 FINK check error handling for plugin load methods (triggered by file change) -> move to separate ticket
					loadMessages(fsWithWatcher, messagesQuery, settings()!, loadMessagePlugin)
				}
			},
		})
		// initial project setup finished - import all messages using legacy load Messages method
		if (_resolvedModules?.resolvedPluginApi.loadMessages && _settings) {
			// get plugin finding the plugin that provides loadMessages function
			const loadMessagePlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.loadMessages !== undefined
			)

			// TODO #1844 FINK check error handling for plugin load methods (initial load) -> move to separate ticket
			await loadMessages(fsWithWatcher, messagesQuery, _settings, loadMessagePlugin)
		}

		const lintReportsQuery = createMessageLintReportsQuery(
			messagesQuery,
			settings as () => ProjectSettings,
			installedMessageLintRules,
			resolvedModules,
			hasWatcher
		)

		// TODO #1844 INFORM this is no longer needed
		// 	const debouncedSave = skipFirst(
		// 		debounce(
		// 			500,
		// 			async (newMessages) => {
		// 				// entered maximum every 500ms - doesn't mean its finished by that time
		// 				try {
		// 					const loadMessagePlugin = _resolvedModules.plugins.find(
		// 						(plugin) => plugin.loadMessages !== undefined
		// 					)
		// 					const loadPluginId = loadMessagePlugin!.id

		// 					const messagesToExport: Message[] = []
		// 					for (const message of newMessages) {
		// 						const fixedExportMessage = { ...message }
		// 						// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
		// 						fixedExportMessage.id =
		// 							fixedExportMessage.alias[loadPluginId] ?? fixedExportMessage.id

		// 						messagesToExport.push(fixedExportMessage)
		// 					}

		// 					// this will execute on the next tick - processing of the maschine translations that returned within the tick will kick in
		// 					await resolvedModules()?.resolvedPluginApi.saveMessages({
		// 						settings: settingsValue,
		// 						messages: messagesToExport,
		// 					})
		// 				} catch (err) {
		// 					throw new PluginSaveMessagesError({
		// 						cause: err,
		// 					})
		// 				}
		// 				const abortController = new AbortController()
		// 				if (
		// 					newMessages.length !== 0 &&
		// 					JSON.stringify(newMessages) !== JSON.stringify(messages()) &&
		// 					nodeishFs.watch("/", { signal: abortController.signal }) !== undefined
		// 				) {
		// 					setMessages(newMessages)
		// 				}
		// 			},
		// 			{ atBegin: false }
		// 		)
		// 	)

		/**
		 * Utility to escape reactive tracking and avoid multiple calls to
		 * the capture event.
		 *
		 * Should be addressed with https://github.com/opral/monorepo/issues/1772
		 */
		let projectLoadedCapturedAlready = false

		if (projectId && projectLoadedCapturedAlready === false) {
			projectLoadedCapturedAlready = true
			// TODO ensure that capture is "awaited" without blocking the the app from starting
			await capture("SDK loaded project", {
				projectId,
				properties: {
					appId: args.appId,
					settings: settings(),
					installedPluginIds: installedPlugins().map((p) => p.id),
					installedMessageLintRuleIds: installedMessageLintRules().map((r) => r.id),
					numberOfMessages: messagesQuery.includedMessageIds().length,
				},
			})
		}

		return {
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				messageLintRules: createSubscribable(() => installedMessageLintRules()),
			},
			errors: createSubscribable(() => [
				...(initializeError ? [initializeError] : []),
				...(resolvedModules() ? resolvedModules()!.errors : []),
				...Object.values(messageLoadErrors()),
				...Object.values(messageSaveErrors()),
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
	projectPath: string
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
		args.nodeishFs.writeFile(args.projectPath + "/settings.json", serializedSettings)
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

// --- serialization of loading / saving messages.
// 1. A plugin saveMessage call can not be called simultaniously to avoid side effects - its an async function not controlled by us
// 2. loading and saving must not run in "parallel".
// - json plugin exports into separate file per language.
// - saving a message in two different languages would lead to a write in de.json first
// - This will leads to a load of the messages and since en.json has not been saved yet the english variant in the message would get overritten with the old state again

let isSaving: boolean
let currentSaveMessages: Promise<void> | undefined
let sheduledSaveMessages:
	| [awaitable: Promise<void>, resolve: () => void, reject: (e: unknown) => void]
	| undefined

let isLoading = false
let sheduledLoadMessages:
	| [awaitable: Promise<void>, resolve: () => void, reject: (e: unknown) => void]
	| undefined

/**
 * Messsage that loads messages from a plugin - this method synchronizes with the saveMessage funciton.
 * If a save is in progress loading will wait until saving is done. If another load kicks in during this load it will queue the
 * load and execute it at the end of this load. subsequential loads will not be queued but the same promise will be reused
 *
 * - NOTE: this means that the parameters used to load like settingsValue and loadPlugin might not take into account. this has to be refactored
 * with the loadProject restructuring
 * @param fs
 * @param messagesQuery
 * @param settingsValue
 * @param loadPlugin
 * @returns void - updates the files and messages in of the project in place
 */
async function loadMessages(
	fs: NodeishFilesystemSubset,
	messagesQuery: InlangProject["query"]["messages"],
	settingsValue: ProjectSettings,
	loadPlugin: any
) {
	// the current approach introuces a sync between both systems - the legacy load / save messages plugins and the new format - we dont delete messages that we don't see int he plugins produced messages array anymore

	// let the current save process finish first
	if (currentSaveMessages) {
		await currentSaveMessages
	}

	// loading is an asynchronous process - check if another load is in progress - queue this call if so
	if (isLoading) {
		if (!sheduledLoadMessages) {
			sheduledLoadMessages = createAwaitable()
		}
		// another load will take place right after the current one - its goingt to be idempotent form the current requested one - don't reschedule
		return sheduledLoadMessages[0]
	}

	// set loading flag
	isLoading = true

	const loadPluginId = loadPlugin!.id

	const loadedMessages = await makeTrulyAsync(
		loadPlugin.loadMessages({
			settings: settingsValue,
			nodeishFs: fs,
		})
	)

	for (const loadedMessage of loadedMessages) {
		const currentMessages = messagesQuery
			.getAll()
			// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
			.filter((message: any) => message.alias["default"] === loadedMessage.id)

		if (currentMessages.length > 1) {
			// NOTE: if we happen to find two messages witht the sam alias we throw for now
			// - this could be the case if one edits the aliase manualy
			throw new Error("more than one message with the same alias found ")
		} else if (currentMessages.length === 1) {
			// update message in place - leave message id and alias untouched
			loadedMessage.alias = {} as any
			// TODO #1585 we have to map the id of the importedMessage to the alias and fill the id property with the id of the existing message - change when import mesage provides importedMessage.alias
			loadedMessage.alias["default"] = loadedMessage.id
			loadedMessage.id = currentMessages[0]!.id

			// TODO #1844 INFORM stringifyMessage encodes messages independent from key order!
			const importedEnecoded = stringifyMessage(loadedMessage)
			const currentMessageEncoded = stringifyMessage(currentMessages[0]!)
			if (importedEnecoded === currentMessageEncoded) {
				continue
			}
			messagesQuery.update({ where: { id: loadedMessage.id }, data: loadedMessage })
		} else {
			// message with the given alias does not exist so far
			loadedMessage.alias = {} as any
			// TODO #1585 we have to map the id of the importedMessage to the alias - change when import mesage provides importedMessage.alias
			loadedMessage.alias["default"] = loadedMessage.id

			let currentOffset = 0
			let messsageId: string | undefined
			do {
				messsageId = humanIdHash(loadedMessage.id, currentOffset)
				if (messagesQuery.get({ where: { id: messsageId } })) {
					currentOffset += 1
					messsageId = undefined
				}
			} while (messsageId === undefined)

			// create a humanId based on a hash of the alias
			loadedMessage.id = messsageId

			// add the message - this will trigger an async file creation in the backgound!
			messagesQuery.create({ data: loadedMessage })
		}
	}

	isLoading = false

	const executingScheduledMessages = sheduledLoadMessages
	if (executingScheduledMessages) {
		// a load has been requested during the load - executed it

		// reset sheduling to except scheduling again
		sheduledLoadMessages = undefined

		// recall load unawaited to allow stack to pop
		loadMessages(fs, messagesQuery, settingsValue, loadPlugin).then(
			() => {
				executingScheduledMessages[1]()
			},
			(e: Error) => {
				executingScheduledMessages[2](e)
			}
		)
	}
}

async function saveMessages(
	fs: NodeishFilesystemSubset,
	messagesQuery: InlangProject["query"]["messages"],
	settingsValue: ProjectSettings,
	savePlugin: any
) {
	// queue next save if we have a save ongoing
	if (isSaving) {
		if (!sheduledSaveMessages) {
			sheduledSaveMessages = createAwaitable()
		}

		return sheduledSaveMessages[0]
	}

	// set isSavingFlag
	isSaving = true

	const savePluginId = savePlugin!.id

	currentSaveMessages = (async function () {
		try {
			const currentMessages = messagesQuery.getAll()

			const messagesToExport: Message[] = []
			for (const message of currentMessages) {
				const fixedExportMessage = { ...message }
				// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
				fixedExportMessage.id = fixedExportMessage.alias["default"] ?? fixedExportMessage.id

				messagesToExport.push(fixedExportMessage)
			}

			// TODO #1844 SPLIT (separate ticket) make sure save messages produces the same output again and again
			await savePlugin.saveMessages({
				settings: settingsValue,
				messages: messagesToExport,
				nodeishFs: fs,
			})
		} catch (err) {
			throw new PluginSaveMessagesError({
				cause: err,
			})
		} finally {
			isSaving = false
		}
	})()

	await currentSaveMessages

	if (sheduledSaveMessages) {
		const executingSheduledSaveMessages = sheduledSaveMessages
		sheduledSaveMessages = undefined

		saveMessages(fs, messagesQuery, settingsValue, savePlugin).then(
			() => {
				executingSheduledSaveMessages[1]()
			},
			(e) => {
				executingSheduledSaveMessages[2](e)
			}
		)
	}
}

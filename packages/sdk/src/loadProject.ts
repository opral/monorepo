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
import { debounce } from "throttle-debounce"
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
	encodeMessage as stringifyMessage,
} from "./storage/helper.js"

import { humanIdHash } from "./storage/human-id/human-readable-id.js"

import type { Repository } from "@lix-js/client"
import { generateProjectId } from "./generateProjectId.js"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"

const settingsCompiler = TypeCompiler.Compile(ProjectSettings)

/**
 * Creates an inlang instance.
 *
 * @param projectPath - Absolute path to the inlang settings file.
 * @param nodeishFs - Filesystem that implements the NodeishFilesystemSubset interface.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 * @param _capture - Use `_capture` to capture events for analytics.
 *
 */
export const loadProject = async (args: {
	projectPath: string
	repo?: Repository
	nodeishFs: NodeishFilesystem
	_import?: ImportFunction
	_capture?: (id: string, props: Record<string, unknown>) => void
}): Promise<InlangProject> => {
	const projectPath = normalizePath(args.projectPath)

	// -- migrate if outdated ------------------------------------------------

	await maybeMigrateToDirectory({ nodeishFs: args.nodeishFs, projectPath })

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

	// -- load project ------------------------------------------------------
	let idError: Error | undefined
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()
		const nodeishFs = createNodeishFsWithAbsolutePaths({
			projectPath,
			nodeishFs: args.nodeishFs,
		})

		let projectId: string | undefined

		try {
			projectId = await nodeishFs.readFile(projectPath + "/project_id", {
				encoding: "utf-8",
			})
		} catch (error) {
			// @ts-ignore
			if (error.code === "ENOENT") {
				if (args.repo) {
					projectId = await generateProjectId(args.repo, projectPath)
					if (projectId) {
						await nodeishFs.writeFile(projectPath + "/project_id", projectId)
					}
				}
			} else {
				idError = error as Error
			}
		}

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
				.then((settings) => {
					setSettings(settings)
					// rename settings to get a convenient access to the data in Posthog
					const project_settings = settings
					args._capture?.("SDK used settings", { project_settings, group: projectId })
				})
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
							// TODO #1844 FILESYSTEM - what is inlangs best practice to handle other file systems atm?
							const stat = await fileSystem.stat(rootPath + pathToRead + "/" + path)

							if (stat.isDirectory()) {
								const subfolderPaths = await readFilesFromFolderRecursive(
									fileSystem,
									rootPath,
									// TODO #1844 FILESYSTEM - what is inlangs best practice to handle other file systems atm?
									pathToRead + "/" + path
								)
								filePaths = filePaths.concat(subfolderPaths)
							} else {
								// TODO #1844 FILESYSTEM - what is inlangs best practice to handle other file systems atm?
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
							// TODO #1844 FINK - test errors being propagated - fink doesnt show errors other than lints at the moment...
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
										// TODO #1844 FINK - test errors being propagated - fink doesnt show errors other than lints at the moment...
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

		const abortController = new AbortController()
		const hasWatcher = nodeishFs.watch("/", { signal: abortController.signal }) !== undefined

		const messagesQuery = createMessagesQuery(() => messages() || [])

		const trackedMessages: Map<string, () => void> = new Map()
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

			for (const messageId of currentMessageIds) {
				if (!trackedMessages!.has(messageId!)) {
					// to avoid to drop the effect after creation we need to create a new disposable root
					createRoot((dispose) => {
						createEffect(() => {
							const message = messagesQuery.get({ where: { id: messageId } })!
							if (!message) {
								return
							}
							if (trackedMessages?.has(messageId)) {
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
										// TODO #1844 test if errors get propagated
										// in case saving didn't work (problem during serialization or saving to file) - add to message error array in project
										messageSaveErrors()[messageId] = new SaveMessageError({
											path: messageFilePath,
											messageId,
											cause: error,
										})
										setMessageSaveErrors(messageLoadErrors)
									})
							} else {
								// initial effect execution - add dispose function
								trackedMessages?.set(messageId, dispose)
							}
						})
					})
				}
			}

			for (const deletedMessage of deletedMessageTrackedMessage) {
				const messageFilePath = messageFolderPath + "/" + getPathFromMessageId(deletedMessage[0])
				try {
					nodeishFs.rm(messageFilePath)
					saveMessages(nodeishFs, messagesQuery, settings()!, saveMessagesPlugin)
					// debouncedSave(messagesQuery.getAll())
				} catch (e) {
					if ((e as any).code !== "ENOENT") {
						throw e
					}
				}
				// dispose
				trackedMessages.get(deletedMessage[0])?.()
				trackedMessages.delete(deletedMessage[0])
			}
		})

		// TODO #1844 CLEARIFY this was used to create a watcher on all files that the fs reads - shall we import on every change as well?
		// TODO #1844 synchronize imports with debouncedSave - wait for the import until the import took place and vice versa - synchronize import/export
		// we need to do this since importers currently don't check the target state. if the importer works on two files en/de and a message is saved for both languages
		// this would lead to a change in one language first – for example en – but the improter would load en and de. de is still in the old state and would override changes
		const fsWithWatcher = createNodeishFsWithWatcher({
			nodeishFs: nodeishFs,
			updateMessages: () => {
				// TODO #1844 this is where the messages are loaded (all) when the message file changed
				// TODO #1844 do we still need to reload all messages when plugins change - guess not
				// loadAndSetMessages(nodeishFs)
			},
		})

		// run import
		const _resolvedModules = resolvedModules()
		const _settings = settings()
		// initial project setup finished - import all messages using legacy load Messages method
		if (_resolvedModules?.resolvedPluginApi.loadMessages && _settings) {
			// get plugin finding the plugin that provides loadMessages function
			const loadMessagePlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.loadMessages !== undefined
			)

			await loadMessages(fsWithWatcher, messagesQuery, _settings, loadMessagePlugin)
		}

		const lintReportsQuery = createMessageLintReportsQuery(
			messagesQuery,
			settings as () => ProjectSettings,
			installedMessageLintRules,
			resolvedModules,
			hasWatcher
		)

		// TODO #1844 i doubt this is needed
		/* const debouncedSave = skipFirst(
			debounce(
				500,
				async (newMessages) => {
					try {
						const loadMessagePlugin = _resolvedModules.plugins.find(
							(plugin) => plugin.loadMessages !== undefined
						)
						const loadPluginId = loadMessagePlugin!.id

						const messagesToExport: Message[] = []
						for (const message of newMessages) {
							const fixedExportMessage = { ...message }
							// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
							fixedExportMessage.id =
								fixedExportMessage.alias[loadPluginId] ?? fixedExportMessage.id

							messagesToExport.push(fixedExportMessage)
						}

						await resolvedModules()?.resolvedPluginApi.saveMessages({
							settings: settingsValue,
							messages: messagesToExport,
						})
					} catch (err) {
						throw new PluginSaveMessagesError({
							cause: err,
						})
					}
					const abortController = new AbortController()
					if (
						newMessages.length !== 0 &&
						JSON.stringify(newMessages) !== JSON.stringify(messages()) &&
						nodeishFs.watch("/", { signal: abortController.signal }) !== undefined
					) {
						setMessages(newMessages)
					}
				},
				{ atBegin: false }
			)
		)*/

		return {
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				messageLintRules: createSubscribable(() => installedMessageLintRules()),
			},
			errors: createSubscribable(() => [
				...(initializeError ? [initializeError] : []),
				...(idError ? [idError] : []),
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
	messagesQuery: any,
	settingsValue: ProjectSettings,
	loadPlugin: any
) {
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

	const importedMessages = await makeTrulyAsync(
		loadPlugin.loadMessages({
			// @ts-ignore
			settings: settingsValue,
			nodeishFs: fs,
		})
	)

	for (const importedMessage of importedMessages) {
		const currentMessages = messagesQuery
			.getAll()
			// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
			.filter((message: any) => message.alias[loadPluginId] === importedMessage.id)

		if (currentMessages.length > 1) {
			// TODO #1844 CLEARIFY how to handle the case that we find a dublicated alias during import? - change Error correspondingly
			throw new Error("more than one message with the same alias found ")
		} else if (currentMessages.length === 1) {
			// update message in place - leave message id and alias untouched
			importedMessage.alias = {} as any
			// TODO #1585 we have to map the id of the importedMessage to the alias and fill the id property with the id of the existing message - change when import mesage provides importedMessage.alias
			importedMessage.alias[loadPluginId] = importedMessage.id
			importedMessage.alias["library.inlang.paraglideJs"] = importedMessage.id
			importedMessage.id = currentMessages[0]!.id
			const importedEnecoded = stringifyMessage(importedMessage)
			const currentMessageEncoded = stringifyMessage(currentMessages[0]!)
			if (importedEnecoded === currentMessageEncoded) {
				continue
			}
			messagesQuery.update({ where: { id: importedMessage.id }, data: importedMessage })
		} else {
			// message with the given alias does not exist so far
			importedMessage.alias = {} as any
			// TODO #1585 we have to map the id of the importedMessage to the alias - change when import mesage provides importedMessage.alias
			importedMessage.alias[loadPluginId] = importedMessage.id
			importedMessage.alias["library.inlang.paraglideJs"] = importedMessage.id

			let currentOffset = 0
			let messsageId: string | undefined
			do {
				messsageId = humanIdHash(importedMessage.id, currentOffset)
				const path = /* messageFolderPath + "/" +*/ getPathFromMessageId(messsageId)
				try {
					await fs.stat(path)
				} catch (e) {
					if ((e as any).code === "ENOENT") {
						// keep the message id!
						continue
					}
					throw e
				}

				currentOffset += 1
				messsageId = undefined
			} while (messsageId === undefined)

			// create a humanId based on a hash of the alias
			importedMessage.id = messsageId

			// TODO #1844 CLEARIFY - we don't block fs here - we could have a situation where a file with the same message id is created in the meantime
			messagesQuery.create({ data: importedMessage })
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
	messagesQuery: any,
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
				fixedExportMessage.id = fixedExportMessage.alias[savePluginId] ?? fixedExportMessage.id

				messagesToExport.push(fixedExportMessage)
			}

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

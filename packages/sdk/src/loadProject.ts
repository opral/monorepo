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
import { normalizePath, type NodeishFilesystem, getDirname } from "@lix-js/fs"
import { isAbsolutePath } from "./isAbsolutePath.js"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"
import { maybeMigrateToDirectory } from "./migrations/migrateToDirectory.js"
import {
	getMessageIdFromPath,
	getPathFromMessageId,
	parseMessage,
	encodeMessage,
} from "./storage/helper.js"

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
	return await createRoot(async () => {
		const [initialized, markInitAsComplete, markInitAsFailed] = createAwaitable()
		const nodeishFs = createNodeishFsWithAbsolutePaths({
			projectPath,
			nodeishFs: args.nodeishFs,
		})

		// -- settings ------------------------------------------------------------

		const [settings, _setSettings] = createSignal<ProjectSettings>()
		createEffect(() => {
			loadSettings({ settingsFilePath: projectPath + "/settings.json", nodeishFs })
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

		const messageFolderPath = projectPath + "/messages"

		createEffect(() => {
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			// TODO #1844 this how  the messages are loaded
			const loadAndSetMessages = async (fs: NodeishFilesystemSubset) => {
				// load all messages
				const messages: Message[] = [] // await this.parentKeyStore.load();

				try {
					// make sure the message folder exists within the .inlang folder
					try {
						await fs.mkdir(messageFolderPath)
					} catch (e) {
						// TODO #1844 find better way to check if the folder exists
					}

					const readFilesFromFolderRecursive = async (
						fileSystem: NodeishFilesystemSubset,
						rootPath: string,
						pathToRead: string
					) => {
						let filePaths: string[] = []
						const paths = await fileSystem.readdir(rootPath + pathToRead)
						for (const path of paths) {
							const stat = await fileSystem.stat(rootPath + pathToRead + "/" + path)

							if (stat.isDirectory()) {
								const subfolderPaths = await readFilesFromFolderRecursive(
									fileSystem,
									rootPath,
									pathToRead + "/" + path
								)
								filePaths = filePaths.concat(subfolderPaths)
							} else {
								filePaths.push(pathToRead + "/" + path)
							}
						}
						return filePaths
					}
					const messageFilePaths = await readFilesFromFolderRecursive(fs, messageFolderPath, "")
					for (const messageFilePath of messageFilePaths) {
						try {
							const messageRaw = await fs.readFile(`${messageFolderPath}${messageFilePath}`, {
								encoding: "utf-8",
							})

							// TODO #1844 the place where we read in the file - if this fails we should consider ignoring it
							const message = parseMessage(messageFilePath, messageRaw) as Message
							messages.push(message)
						} catch (e) {
							console.log(e)
						}
					}

					setMessages(messages)

					markInitAsComplete()
				} catch (err) {
					markInitAsFailed(new PluginLoadMessagesError({ cause: err }))
				}

			}

			// TODO #1844 this was used to create a watcher on all files that the fs reads - to trigger updates of plugins - check how we want this be handled with our own persistence
			// const fsWithWatcher = createNodeishFsWithWatcher({
			// 	nodeishFs: nodeishFs,
			// 	updateMessages: () => {
			// 		// TODO #1844 this is where the messages are loaded (all) when the message file changed
			// 		// TODO #1844 do we still need to reload all messages when plugins change - guess not
			// 		// loadAndSetMessages(nodeishFs)
			// 	},
			// })

			// inital loading of all messages
			loadAndSetMessages(fsWithWatcher).then(() => {
				// when initial message loading is done start watching on file changes in the message dir
				;(async () => {
					try {
						const watcher = nodeishFs.watch(messageFolderPath, {
							// TODO #1844  - check who would signal here -
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
									continue
								}

								let fileContent: string | undefined
								// TODO #1844 lets read the message and reload it
								try {
									fileContent = await nodeishFs.readFile(
										messageFolderPath + "/" + event.filename!,
										{ encoding: "utf-8" }
									)
								} catch (e) {
									// TODO #1844 check for file not exists - ENOENT and rethrow if different error
									// if (e.code !== 'ENOENT') {
									// 	throw e;
									// }
									// deleted = true;
									// file does not exis - drop message in inlang project
								}

								if (!fileContent) {
									messagesQuery.delete({ where: { id: messageId } })
								} else {
									const message = parseMessage(event.filename, fileContent)
									const currentMessage = messagesQuery.get({ where: { id: messageId } })
									const currentMessageEncoded = encodeMessage(currentMessage)
									if (currentMessage && currentMessageEncoded === fileContent) {
										continue
									}

									messagesQuery.upsert({ where: { id: messageId }, data: message })
								}
							}
						}
					} catch (err: any) {
						if (err.name === "AbortError") return
						// https://github.com/inlang/monorepo/issues/1647
						// the file does not exist (yet)
						// this is not testable beacause the fs.watch api differs
						// from node and lix. lenghty
						else if (err.code === "ENOENT") return
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

		let trackedMessages: Set<string> | undefined
		// subscribe to all messages and write to disc on signal
		createEffect(() => {
			let initialEffectCreation = false
			if (trackedMessages === undefined) {
				initialEffectCreation = true
				trackedMessages = new Set<string>()
			}

			const currentMessageIds = messagesQuery.includedMessageIds()
			const deletedMessageIds = [...trackedMessages].filter(
				(tracked) => !currentMessageIds.includes(tracked)
			)
			for (const messageId of currentMessageIds) {
				const message = messagesQuery.get({ where: { id: messageId } })!
				if (!trackedMessages!.has(messageId!)) {
					createEffect(
						() => {
							if (!initialEffectCreation) {
								debugger

								const createMessage = async (
									fs: NodeishFilesystemSubset,
									path: string,
									message: Message
								) => {
									let dir = getDirname(path)
									dir = dir.endsWith("/") ? dir.slice(0, -1) : dir

									try {
										await fs.mkdir(dir, { recursive: true })
									} catch (e) {}

									console.log("filePath RECURSIVE " + path)

									await fs.writeFile(path, encodeMessage(message))
								}
								const messageFilePath = messageFolderPath + "/" + getPathFromMessageId(message.id)
								createMessage(nodeishFs, messageFilePath, message)
							} else {
								console.log("initial creation skipped")
							}
						},
						{ signal: messagesQuery.get({ where: { id: messageId } }) }
					)
					trackedMessages.add(messageId)
				}
				// console.log("CREATE EFFECT to react on changes in specific message")
			}

			for (const deletedMessageId of deletedMessageIds) {
				if (!initialEffectCreation) {
					const messageFilePath = messageFolderPath + "/" + getPathFromMessageId(deletedMessageId)
					try {
						nodeishFs.rm(messageFilePath)
					} catch (e) {
						// TODO #1844 check if we have a file not exits error
						console.log(
							"message that was deleted in the project did not have a representation on disc"
						)
					}
				}
				trackedMessages.delete(deletedMessageId)
			}
		})

		// run import
		const _resolvedModules = resolvedModules()
		// initial project setup finished - import all messages usign legacy load Messages
		if (_resolvedModules?.resolvedPluginApi.loadMessages) {
			const importedMessages = await makeTrulyAsync(
				_resolvedModules.resolvedPluginApi.loadMessages({
					// @ts-ignore
					settings: settingsValue,
					nodeishFs: nodeishFs,
				})
			)

			for (const importedMessage of importedMessages) {
				const currentMessage = messagesQuery.get({ where: { id: importedMessage.id } })
				const importedEnecoded = encodeMessage(importedMessage)
				const currentMessageEncoded = encodeMessage(currentMessage)
				if (currentMessage && importedEnecoded === currentMessageEncoded) {
					continue
				}
				// console.log("updating message from import " + importedMessage.id)
				messagesQuery.upsert({ where: { id: importedMessage.id }, data: importedMessage })
			}
		}

		const lintReportsQuery = createMessageLintReportsQuery(
			messagesQuery,
			settings as () => ProjectSettings,
			installedMessageLintRules,
			resolvedModules,
			hasWatcher
		)

		// const debouncedSave = skipFirst(
		// 	debounce(
		// 		500,
		// 		async (newMessages) => {
		// 			try {
		// 				await resolvedModules()?.resolvedPluginApi.saveMessages({
		// 					settings: settingsValue,
		// 					messages: newMessages,
		// 				})
		// 			} catch (err) {
		// 				throw new PluginSaveMessagesError({
		// 					cause: err,
		// 				})
		// 			}
		// 		},
		// 		{ atBegin: false }
		// 	)
		// )

		// createEffect(() => {
		// 	debouncedSave(messagesQuery.getAll())
		// })

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

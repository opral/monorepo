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
	PluginSaveMessagesError,
	LoadProjectInvalidArgument,
	PluginLoadMessagesError,
} from "./errors.js"
import { createRoot, createSignal, createEffect } from "./reactivity/solid.js"
import { createMessagesQuery } from "./createMessagesQuery.js"
import { createMessageLintReportsQuery } from "./createMessageLintReportsQuery.js"
import { ProjectSettings, Message, type NodeishFilesystemSubset } from "./versionedInterfaces.js"
import { tryCatch, type Result } from "@inlang/result"
import { migrateIfOutdated } from "@inlang/project-settings/migration"
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js"
import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { isAbsolutePath } from "./isAbsolutePath.js"
import { maybeMigrateToDirectory } from "./migrations/migrateToDirectory.js"

import { stringifyMessage as stringifyMessage } from "./storage/helper.js"

import { humanIdHash } from "./storage/human-id/human-readable-id.js"

import type { Repository } from "@lix-js/client"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"

import { maybeCreateFirstProjectId } from "./migrations/maybeCreateFirstProjectId.js"

import { capture } from "./telemetry/capture.js"
import { identifyProject } from "./telemetry/groupIdentify.js"
import type { NodeishStats } from "@lix-js/fs"

import _debug from "debug"
const debug = _debug("loadProject")

const settingsCompiler = TypeCompiler.Compile(ProjectSettings)

type MessageState = {
	messageDirtyFlags: {
		[messageId: string]: boolean
	}
	messageLoadHash: {
		[messageId: string]: string
	}
	isSaving: boolean
	currentSaveMessagesViaPlugin: Promise<void> | undefined
	sheduledSaveMessages:
		| [awaitable: Promise<void>, resolve: () => void, reject: (e: unknown) => void]
		| undefined
	isLoading: boolean
	sheduledLoadMessagesViaPlugin:
		| [awaitable: Promise<void>, resolve: () => void, reject: (e: unknown) => void]
		| undefined
}

/**
 * @param projectPath - Absolute path to the inlang settings file.
 * @param repo - An instance of a lix repo as returned by `openRepository`.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 * @param appId - The app id to use for telemetry e.g "app.inlang.badge"
 *
 */
export async function loadProject(args: {
	projectPath: string
	repo: Repository
	appId?: string
	_import?: ImportFunction
}): Promise<InlangProject> {
	const projectPath = normalizePath(args.projectPath)

	const messageStates = {
		messageDirtyFlags: {},
		messageLoadHash: {},
		isSaving: false,
		currentSaveMessagesViaPlugin: undefined,
		sheduledSaveMessages: undefined,
		isLoading: false,
		sheduledLoadMessagesViaPlugin: undefined,
	} as MessageState

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

	const nodeishFs = createNodeishFsWithAbsolutePaths({
		projectPath,
		nodeishFs: args.repo.nodeishFs,
	})

	// -- migratations ------------------------------------------------

	await maybeMigrateToDirectory({ nodeishFs, projectPath })
	await maybeCreateFirstProjectId({ projectPath, repo: args.repo })

	// -- load project ------------------------------------------------------

	return await createRoot(async () => {
		// TODO remove tryCatch after https://github.com/opral/monorepo/issues/2013
		// - a repo will always be present
		// - if a repo is present, the project id will always be present
		const { data: projectId } = await tryCatch(() =>
			nodeishFs.readFile(args.projectPath + "/project_id", { encoding: "utf-8" })
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- setMessages is not called directly we use the CRUD operations on the messageQuery to set the messages now
		const [messages, setMessages] = createSignal<Message[]>([])

		const [loadMessagesViaPluginError, setLoadMessagesViaPluginError] = createSignal<
			Error | undefined
		>()

		const [saveMessagesViaPluginError, setSaveMessagesViaPluginError] = createSignal<
			Error | undefined
		>()

		const messagesQuery = createMessagesQuery(() => messages())

		const messageLockDirPath = projectPath + "/messagelock"

		createEffect(() => {
			// wait for first effect excution until modules are resolved
			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			if (!_resolvedModules.resolvedPluginApi.loadMessages) {
				markInitAsFailed(undefined)
				return
			}

			const _settings = settings()
			if (!_settings) return

			// get plugin finding the plugin that provides loadMessages function
			const loadMessagePlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.loadMessages !== undefined
			)

			// TODO #1844 this watcher needs to get pruned when we have a change in the configs which will trigger this again
			const fsWithWatcher = createNodeishFsWithWatcher({
				nodeishFs: nodeishFs,
				// this message is called whenever a file changes that was read earlier by this filesystem
				// - the plugin loads messages -> reads the file messages.json -> start watching on messages.json -> updateMessages
				updateMessages: () => {
					// preserving console.logs as comments pending #
					debug("load messages because of a change in the message.json files")
					loadMessagesViaPlugin(
						fsWithWatcher,
						messageLockDirPath,
						messageStates,
						messagesQuery,
						settings()!, // NOTE we bang here - we don't expect the settings to become null during the livetime of a project
						loadMessagePlugin
					)
						.catch((e) => setLoadMessagesViaPluginError(new PluginLoadMessagesError({ cause: e })))
						.then(() => {
							if (loadMessagesViaPluginError() !== undefined) {
								setLoadMessagesViaPluginError(undefined)
							}
						})
				},
			})

			loadMessagesViaPlugin(
				fsWithWatcher,
				messageLockDirPath,
				messageStates,
				messagesQuery,
				_settings,
				loadMessagePlugin
			)
				.then(() => {
					markInitAsComplete()
				})
				.catch((err) => {
					markInitAsFailed(new PluginLoadMessagesError({ cause: err }))
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
						settingsSchema: rule.settingsSchema,
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
				settingsSchema: plugin.settingsSchema,
			})) satisfies Array<InstalledPlugin>
		}

		// -- app ---------------------------------------------------------------

		const initializeError: Error | undefined = await initialized.catch((error) => error)

		const abortController = new AbortController()
		nodeishFs.watch("/", { signal: abortController.signal }) !== undefined

		// map of message id => dispose function from createRoot for each message
		const trackedMessages: Map<string, () => void> = new Map()
		let initialSetup = true
		// -- subscribe to all messages and write to files on signal -------------
		createEffect(() => {
			// debug("Outer createEffect")

			const _resolvedModules = resolvedModules()
			if (!_resolvedModules) return

			const currentMessageIds = new Set(messagesQuery.includedMessageIds())
			const deletedTrackedMessages = [...trackedMessages].filter(
				(tracked) => !currentMessageIds.has(tracked[0])
			)

			const saveMessagesPlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.saveMessages !== undefined
			)
			const loadMessagesPlugin = _resolvedModules.plugins.find(
				(plugin) => plugin.loadMessages !== undefined
			)

			for (const messageId of currentMessageIds) {
				if (!trackedMessages!.has(messageId!)) {
					// we create a new root to be able to cleanup an effect for a message that got deleted
					createRoot((dispose) => {
						createEffect(() => {
							// debug("Inner createEffect", messageId)

							const message = messagesQuery.get({ where: { id: messageId } })!
							if (!message) {
								return
							}
							if (!trackedMessages?.has(messageId)) {
								// initial effect execution - add dispose function
								trackedMessages?.set(messageId, dispose)
							}

							// don't trigger saves or set dirty flags during initial setup
							if (!initialSetup) {
								messageStates.messageDirtyFlags[message.id] = true
								saveMessagesViaPlugin(
									nodeishFs,
									messageLockDirPath,
									messageStates,
									messagesQuery,
									settings()!,
									saveMessagesPlugin,
									loadMessagesPlugin
								)
									.catch((e) =>
										setSaveMessagesViaPluginError(new PluginSaveMessagesError({ cause: e }))
									)
									.then(() => {
										if (saveMessagesViaPluginError() !== undefined) {
											setSaveMessagesViaPluginError(undefined)
										}
									})
							}
						})
					})
				}
			}

			for (const deletedMessage of deletedTrackedMessages) {
				const deletedMessageId = deletedMessage[0]

				// call dispose to cleanup the effect
				const messageEffectDisposeFunction = trackedMessages.get(deletedMessageId)
				if (messageEffectDisposeFunction) {
					messageEffectDisposeFunction()
					trackedMessages.delete(deletedMessageId)
				}
				// mark the deleted message as dirty to force a save
				messageStates.messageDirtyFlags[deletedMessageId] = true
			}

			if (deletedTrackedMessages.length > 0) {
				// we keep track of the latest save within the loadProject call to await it at the end - this is not used in subsequetial upserts
				saveMessagesViaPlugin(
					nodeishFs,
					messageLockDirPath,
					messageStates,
					messagesQuery,
					settings()!,
					saveMessagesPlugin,
					loadMessagesPlugin
				)
					.catch((e) => setSaveMessagesViaPluginError(new PluginSaveMessagesError({ cause: e })))
					.then(() => {
						if (saveMessagesViaPluginError() !== undefined) {
							setSaveMessagesViaPluginError(undefined)
						}
					})
			}

			initialSetup = false
		})

		const lintReportsQuery = createMessageLintReportsQuery(
			messagesQuery,
			settings as () => ProjectSettings,
			installedMessageLintRules,
			resolvedModules
		)

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
			await identifyProject({
				projectId,
				properties: {
					// using the id for now as a name but can be changed in the future
					// we need at least one property to make a project visible in the dashboard
					name: projectId,
				},
			})
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
			id: projectId,
			installed: {
				plugins: createSubscribable(() => installedPlugins()),
				messageLintRules: createSubscribable(() => installedMessageLintRules()),
			},
			errors: createSubscribable(() => [
				...(initializeError ? [initializeError] : []),
				...(resolvedModules() ? resolvedModules()!.errors : []),
				...(loadMessagesViaPluginError() ? [loadMessagesViaPluginError()!] : []),
				...(saveMessagesViaPluginError() ? [saveMessagesViaPluginError()!] : []),
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
async function loadMessagesViaPlugin(
	fs: NodeishFilesystem,
	lockDirPath: string,
	messageState: MessageState,
	messagesQuery: InlangProject["query"]["messages"],
	settingsValue: ProjectSettings,
	loadPlugin: any
) {
	const experimentalAliases = !!settingsValue.experimental?.aliases

	// loading is an asynchronous process - check if another load is in progress - queue this call if so
	if (messageState.isLoading) {
		if (!messageState.sheduledLoadMessagesViaPlugin) {
			messageState.sheduledLoadMessagesViaPlugin = createAwaitable()
		}
		// another load will take place right after the current one - its goingt to be idempotent form the current requested one - don't reschedule
		return messageState.sheduledLoadMessagesViaPlugin[0]
	}

	// set loading flag
	messageState.isLoading = true
	let lockTime: number | undefined = undefined

	try {
		lockTime = await acquireFileLock(fs as NodeishFilesystem, lockDirPath, "loadMessage")
		const loadedMessages = await makeTrulyAsync(
			loadPlugin.loadMessages({
				settings: settingsValue,
				nodeishFs: fs,
			})
		)

		for (const loadedMessage of loadedMessages) {
			const loadedMessageClone = structuredClone(loadedMessage)

			const currentMessages = messagesQuery
				.getAll()
				// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
				.filter(
					(message: any) =>
						(experimentalAliases ? message.alias["default"] : message.id) === loadedMessage.id
				)

			if (currentMessages.length > 1) {
				// NOTE: if we happen to find two messages witht the sam alias we throw for now
				// - this could be the case if one edits the aliase manualy
				throw new Error("more than one message with the same id or alias found ")
			} else if (currentMessages.length === 1) {
				// update message in place - leave message id and alias untouched
				loadedMessageClone.alias = {} as any

				// TODO #1585 we have to map the id of the importedMessage to the alias and fill the id property with the id of the existing message - change when import mesage provides importedMessage.alias
				if (experimentalAliases) {
					loadedMessageClone.alias["default"] = loadedMessageClone.id
					loadedMessageClone.id = currentMessages[0]!.id
				}

				// NOTE stringifyMessage encodes messages independent from key order!
				const importedEnecoded = stringifyMessage(loadedMessageClone)

				// NOTE could use hash instead of the whole object JSON to save memory...
				if (messageState.messageLoadHash[loadedMessageClone.id] === importedEnecoded) {
					debug("skipping upsert!")
					continue
				}

				// This logic is preventing cycles - could also be handled if update api had a parameter for who triggered update
				// e.g. when FS was updated, we don't need to write back to FS
				// update is synchronous, so update effect will be triggered immediately
				// NOTE: this might trigger a save before we have the chance to delete - but since save is async and waits for the lock acquired by this method - its save to set the flags afterwards
				messagesQuery.update({ where: { id: loadedMessageClone.id }, data: loadedMessageClone })
				// we load a fresh version - lets delete dirty flag that got created by the update
				delete messageState.messageDirtyFlags[loadedMessageClone.id]
				// NOTE could use hash instead of the whole object JSON to save memory...
				messageState.messageLoadHash[loadedMessageClone.id] = importedEnecoded
			} else {
				// message with the given alias does not exist so far
				loadedMessageClone.alias = {} as any
				// TODO #1585 we have to map the id of the importedMessage to the alias - change when import mesage provides importedMessage.alias
				if (experimentalAliases) {
					loadedMessageClone.alias["default"] = loadedMessageClone.id

					let currentOffset = 0
					let messsageId: string | undefined
					do {
						messsageId = humanIdHash(loadedMessageClone.id, currentOffset)
						if (messagesQuery.get({ where: { id: messsageId } })) {
							currentOffset += 1
							messsageId = undefined
						}
					} while (messsageId === undefined)

					// create a humanId based on a hash of the alias
					loadedMessageClone.id = messsageId
				}

				const importedEnecoded = stringifyMessage(loadedMessageClone)

				// add the message - this will trigger an async file creation in the backgound!
				messagesQuery.create({ data: loadedMessageClone })
				// we load a fresh version - lets delete dirty flag that got created by the create method
				delete messageState.messageDirtyFlags[loadedMessageClone.id]
				messageState.messageLoadHash[loadedMessageClone.id] = importedEnecoded
			}
		}
		await releaseLock(fs as NodeishFilesystem, lockDirPath, "loadMessage", lockTime)
		lockTime = undefined

		debug("loadMessagesViaPlugin: " + loadedMessages.length + " Messages processed ")

		messageState.isLoading = false
	} finally {
		if (lockTime !== undefined) {
			await releaseLock(fs as NodeishFilesystem, lockDirPath, "loadMessage", lockTime)
		}
		messageState.isLoading = false
	}

	const executingScheduledMessages = messageState.sheduledLoadMessagesViaPlugin
	if (executingScheduledMessages) {
		// a load has been requested during the load - executed it

		// reset sheduling to except scheduling again
		messageState.sheduledLoadMessagesViaPlugin = undefined

		// recall load unawaited to allow stack to pop
		loadMessagesViaPlugin(fs, lockDirPath, messageState, messagesQuery, settingsValue, loadPlugin)
			.then(() => {
				// resolve the scheduled load message promise
				executingScheduledMessages[1]()
			})
			.catch((e: Error) => {
				// reject the scheduled load message promise
				executingScheduledMessages[2](e)
			})
	}
}

async function saveMessagesViaPlugin(
	fs: NodeishFilesystem,
	lockDirPath: string,
	messageState: MessageState,
	messagesQuery: InlangProject["query"]["messages"],
	settingsValue: ProjectSettings,
	savePlugin: any,
	loadPlugin: any
): Promise<void> {
	// queue next save if we have a save ongoing
	if (messageState.isSaving) {
		if (!messageState.sheduledSaveMessages) {
			messageState.sheduledSaveMessages = createAwaitable()
		}

		return messageState.sheduledSaveMessages[0]
	}

	// set isSavingFlag
	messageState.isSaving = true

	messageState.currentSaveMessagesViaPlugin = (async function () {
		const saveMessageHashes = {} as { [messageId: string]: string }

		// check if we have any dirty message - witho
		if (Object.keys(messageState.messageDirtyFlags).length == 0) {
			// nothing to save :-)
			debug("save was skipped - no messages marked as dirty... build!")
			messageState.isSaving = false
			return
		}

		let messageDirtyFlagsBeforeSave: typeof messageState.messageDirtyFlags | undefined
		let lockTime: number | undefined
		try {
			lockTime = await acquireFileLock(fs as NodeishFilesystem, lockDirPath, "saveMessage")

			// since it may takes some time to acquire the lock we check if the save is required still (loadMessage could have happend in between)
			if (Object.keys(messageState.messageDirtyFlags).length == 0) {
				debug("save was skipped - no messages marked as dirty... releasing lock again")
				messageState.isSaving = false
				// release lock in finally block
				return
			}

			const currentMessages = messagesQuery.getAll()

			const messagesToExport: Message[] = []
			for (const message of currentMessages) {
				if (messageState.messageDirtyFlags[message.id]) {
					const importedEnecoded = stringifyMessage(message)
					// NOTE: could use hash instead of the whole object JSON to save memory...
					saveMessageHashes[message.id] = importedEnecoded
				}

				const fixedExportMessage = { ...message }
				// TODO #1585 here we match using the id to support legacy load message plugins - after we introduced import / export methods we will use importedMessage.alias
				if (settingsValue.experimental?.aliases) {
					fixedExportMessage.id = fixedExportMessage.alias["default"] ?? fixedExportMessage.id
				}

				messagesToExport.push(fixedExportMessage)
			}

			// wa are about to save the messages to the plugin - reset all flags now
			messageDirtyFlagsBeforeSave = { ...messageState.messageDirtyFlags }
			messageState.messageDirtyFlags = {}

			// NOTE: this assumes that the plugin will handle message ordering
			await savePlugin.saveMessages({
				settings: settingsValue,
				messages: messagesToExport,
				nodeishFs: fs,
			})

			for (const [messageId, messageHash] of Object.entries(saveMessageHashes)) {
				messageState.messageLoadHash[messageId] = messageHash
			}

			if (lockTime !== undefined) {
				await releaseLock(fs as NodeishFilesystem, lockDirPath, "saveMessage", lockTime)
				lockTime = undefined
			}

			// if there is a queued load, allow it to take the lock before we run additional saves.
			if (messageState.sheduledLoadMessagesViaPlugin) {
				debug("saveMessagesViaPlugin calling queued loadMessagesViaPlugin to share lock")
				await loadMessagesViaPlugin(
					fs,
					lockDirPath,
					messageState,
					messagesQuery,
					settingsValue,
					loadPlugin
				)
			}

			messageState.isSaving = false
		} catch (err) {
			// something went wrong - add dirty flags again
			if (messageDirtyFlagsBeforeSave !== undefined) {
				for (const dirtyMessageId of Object.keys(messageDirtyFlagsBeforeSave)) {
					messageState.messageDirtyFlags[dirtyMessageId] = true
				}
			}

			if (lockTime !== undefined) {
				await releaseLock(fs as NodeishFilesystem, lockDirPath, "saveMessage", lockTime)
				lockTime = undefined
			}
			messageState.isSaving = false

			// ok an error
			throw new PluginSaveMessagesError({
				cause: err,
			})
		} finally {
			if (lockTime !== undefined) {
				await releaseLock(fs as NodeishFilesystem, lockDirPath, "saveMessage", lockTime)
				lockTime = undefined
			}
			messageState.isSaving = false
		}
	})()

	await messageState.currentSaveMessagesViaPlugin

	if (messageState.sheduledSaveMessages) {
		const executingSheduledSaveMessages = messageState.sheduledSaveMessages
		messageState.sheduledSaveMessages = undefined

		saveMessagesViaPlugin(
			fs,
			lockDirPath,
			messageState,
			messagesQuery,
			settingsValue,
			savePlugin,
			loadPlugin
		)
			.then(() => {
				executingSheduledSaveMessages[1]()
			})
			.catch((e: Error) => {
				executingSheduledSaveMessages[2](e)
			})
	}
}

const maxRetries = 10
const nProbes = 50
const probeInterval = 100
async function acquireFileLock(
	fs: NodeishFilesystem,
	lockDirPath: string,
	lockOrigin: string,
	tryCount: number = 0
): Promise<number> {
	if (tryCount > maxRetries) {
		throw new Error(lockOrigin + " exceeded maximum Retries (5) to acquire lockfile " + tryCount)
	}

	try {
		debug(lockOrigin + " tries to acquire a lockfile Retry Nr.: " + tryCount)
		await fs.mkdir(lockDirPath)
		const stats = await fs.stat(lockDirPath)
		debug(lockOrigin + " acquired a lockfile Retry Nr.: " + tryCount)
		return stats.mtimeMs
	} catch (error: any) {
		if (error.code !== "EEXIST") {
			// we only expect the error that the file exists already (locked by other process)
			throw error
		}
	}

	let currentLockTime: number

	try {
		const stats = await fs.stat(lockDirPath)
		currentLockTime = stats.mtimeMs
	} catch (fstatError: any) {
		if (fstatError.code === "ENOENT") {
			// lock file seems to be gone :) - lets try again
			debug(lockOrigin + " tryCount++ lock file seems to be gone :) - lets try again " + tryCount)
			return acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
		}
		throw fstatError
	}
	debug(
		lockOrigin +
			" tries to acquire a lockfile  - lock currently in use... starting probe phase " +
			tryCount
	)

	return new Promise((resolve, reject) => {
		let probeCounts = 0
		const scheduleProbationTimeout = () => {
			setTimeout(async () => {
				probeCounts += 1
				let lockFileStats: undefined | NodeishStats = undefined
				try {
					debug(
						lockOrigin + " tries to acquire a lockfile - check if the lock is free now " + tryCount
					)

					// alright lets give it another try
					lockFileStats = await fs.stat(lockDirPath)
				} catch (fstatError: any) {
					if (fstatError.code === "ENOENT") {
						debug(
							lockOrigin +
								" tryCount++ in Promise - tries to acquire a lockfile - lock file seems to be free now - try to acquire " +
								tryCount
						)
						const lock = acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
						return resolve(lock)
					}
					return reject(fstatError)
				}

				// still the same locker! -
				if (lockFileStats.mtimeMs === currentLockTime) {
					if (probeCounts >= nProbes) {
						// ok maximum lock time ran up (we waitetd nProbes * probeInterval) - we consider the lock to be stale
						debug(
							lockOrigin +
								" tries to acquire a lockfile  - lock not free - but stale lets drop it" +
								tryCount
						)
						try {
							await fs.rmdir(lockDirPath)
						} catch (rmLockError: any) {
							if (rmLockError.code === "ENOENT") {
								// lock already gone?
								// Option 1: The "stale process" decided to get rid of it
								// Option 2: Another process acquiring the lock and detected a stale one as well
							}
							return reject(rmLockError)
						}
						try {
							debug(
								lockOrigin +
									" tryCount++ same locker - try to acquire again after removing stale lock " +
									tryCount
							)
							const lock = await acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
							return resolve(lock)
						} catch (lockAquireException) {
							return reject(lockAquireException)
						}
					} else {
						// lets schedule a new probation
						return scheduleProbationTimeout()
					}
				} else {
					try {
						debug(lockOrigin + " tryCount++ different locker - try to acquire again " + tryCount)
						const lock = await acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
						return resolve(lock)
					} catch (error) {
						return reject(error)
					}
				}
			}, probeInterval)
		}
		scheduleProbationTimeout()
	})
}

async function releaseLock(
	fs: NodeishFilesystem,
	lockDirPath: string,
	lockOrigin: string,
	lockTime: number
) {
	debug(lockOrigin + " releasing the lock ")
	try {
		const stats = await fs.stat(lockDirPath)
		if (stats.mtimeMs === lockTime) {
			// this can be corrupt as welll since the last getStat and the current a modification could have occured :-/
			await fs.rmdir(lockDirPath)
		}
	} catch (statError: any) {
		debug(lockOrigin + " couldn't release the lock")
		if (statError.code === "ENOENT") {
			// ok seeks like the log was released by someone else
			debug(lockOrigin + " WARNING - the lock was released by a different process")
			return
		}
		debug(statError)
		throw statError
	}
}

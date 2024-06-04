import type { Message } from "@inlang/message"
import { ReactiveMap } from "./reactivity/map.js"
import { createEffect, onCleanup, batch } from "./reactivity/solid.js"
import { createSubscribable } from "./loadProject.js"
import type { InlangProject, MessageQueryApi, MessageQueryDelegate } from "./api.js"
import type { ResolvedPluginApi } from "./resolve-modules/plugins/types.js"
import type { resolveModules } from "./resolve-modules/resolveModules.js"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import { stringifyMessage } from "./storage/helper.js"
import { acquireFileLock } from "./persistence/filelock/acquireFileLock.js"
import _debug from "debug"
import type { ProjectSettings } from "@inlang/project-settings"
import { releaseLock } from "./persistence/filelock/releaseLock.js"
import { PluginLoadMessagesError, PluginSaveMessagesError } from "./errors.js"
import { humanIdHash } from "./storage/human-id/human-readable-id.js"
const debug = _debug("sdk:messages")

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
		| { promise: Promise<void>; resolve: () => void; reject: (e: unknown) => void }
		| undefined
	isLoading: boolean
	sheduledLoadMessagesViaPlugin:
		| { promise: Promise<void>; resolve: () => void; reject: (e: unknown) => void }
		| undefined
}

type createMessagesQueryParameters = {
	projectPath: string
	nodeishFs: NodeishFilesystem
	settings: () => ProjectSettings | undefined
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined
	onInitialMessageLoadResult: (e?: Error) => void
	onLoadMessageResult: (e?: Error) => void
	onSaveMessageResult: (e?: Error) => void
}
/**
 * Creates a reactive query API for messages.
 */
export function createMessagesQuery({
	projectPath,
	nodeishFs,
	settings,
	resolvedModules,
	onInitialMessageLoadResult,
	onLoadMessageResult,
	onSaveMessageResult,
}: createMessagesQueryParameters): InlangProject["query"]["messages"] {
	// @ts-expect-error
	const index = new ReactiveMap<string, Message>()
	let loaded = false

	// filepath for the lock folder
	const messageLockDirPath = projectPath + "/messagelock"

	let delegate: MessageQueryDelegate | undefined = undefined

	const setDelegate = (newDelegate: MessageQueryDelegate | undefined, onLoad: boolean) => {
		delegate = newDelegate
		if (newDelegate && loaded && onLoad) {
			newDelegate.onLoaded([...index.values()] as Message[])
		}
	}

	// Map default alias to message
	// Assumes that aliases are only created and deleted, not updated
	// TODO #2346 - handle updates to aliases
	// TODO #2346 - refine to hold messageId[], if default alias is not unique
	// @ts-expect-error
	const defaultAliasIndex = new ReactiveMap<string, Message>()

	const messageStates = {
		messageDirtyFlags: {},
		messageLoadHash: {},
		isSaving: false,
		currentSaveMessagesViaPlugin: undefined,
		sheduledSaveMessages: undefined,
		isLoading: false,
		sheduledLoadMessagesViaPlugin: undefined,
	} as MessageState

	// triggered whenever settings or resolved modules change
	createEffect(() => {
		// we clear the index independent from the change for
		index.clear()
		defaultAliasIndex.clear()
		loaded = false

		// Load messages -> use settings to subscribe to signals from the settings
		const _settings = settings()
		if (!_settings) return

		// wait for first effect excution until modules are resolved
		const resolvedPluginApi = resolvedModules()?.resolvedPluginApi
		if (!resolvedPluginApi) return

		const fsWithWatcher = createNodeishFsWithWatcher({
			nodeishFs: nodeishFs,
			// this message is called whenever a file changes that was read earlier by this filesystem
			// - the plugin loads messages -> reads the file messages.json -> start watching on messages.json -> updateMessages
			updateMessages: () => {
				// reload
				loadMessagesViaPlugin(
					fsWithWatcher,
					messageLockDirPath,
					messageStates,
					index,
					delegate,
					_settings, // NOTE we bang here - we don't expect the settings to become null during the livetime of a project
					resolvedPluginApi
				)
					.catch((e) => {
						onLoadMessageResult(e)
					})
					.then(() => {
						onLoadMessageResult()
					})
			},
		})

		// called between executions of effects as well as on disposal
		onCleanup(() => {
			// stop listening on fs events
			fsWithWatcher.stopWatching()
			delegate?.onCleanup()
		})

		if (!resolvedPluginApi.loadMessages) {
			onInitialMessageLoadResult(new Error("no loadMessages in resolved Modules found"))
			return
		}
		loadMessagesViaPlugin(
			fsWithWatcher,
			messageLockDirPath,
			messageStates,
			index,
			undefined /* delegate - we don't pass it here since we will call onLoaded instead */,
			_settings, // NOTE we bang here - we don't expect the settings to become null during the livetime of a project
			resolvedPluginApi
		)
			.catch((e) => {
				// propagate initial load error to calling laodProject function
				onInitialMessageLoadResult(new PluginLoadMessagesError({ cause: e }))
			})
			.then(() => {
				onInitialMessageLoadResult()
				delegate?.onLoaded([...index.values()])
				loaded = true
			})
	})

	const get = (args: Parameters<MessageQueryApi["get"]>[0]) => index.get(args.where.id)

	const getByDefaultAlias = (alias: Parameters<MessageQueryApi["getByDefaultAlias"]>[0]) =>
		defaultAliasIndex.get(alias)

	const scheduleSave = function () {
		// NOTE: we ignore save calls on a project without settings for now

		const _settings = settings()
		if (!_settings) return

		// wait for first effect excution until modules are resolved
		const resolvedPluginApi = resolvedModules()?.resolvedPluginApi
		if (!resolvedPluginApi) return

		saveMessagesViaPlugin(
			nodeishFs,
			messageLockDirPath,
			messageStates,
			index,
			delegate,
			_settings, // NOTE we bang here - we don't expect the settings to become null during the livetime of a project
			resolvedPluginApi
		)
			.catch((e) => {
				debug.log("error during saveMessagesViaPlugin")
				debug.log(e)
			})
			.catch((e) => {
				onSaveMessageResult(e)
			})
			.then(() => {
				onSaveMessageResult()
			})
	}

	return {
		setDelegate,
		create: ({ data }): boolean => {
			if (index.has(data.id)) return false
			index.set(data.id, data)
			if ("default" in data.alias) {
				defaultAliasIndex.set(data.alias.default, data)
			}

			messageStates.messageDirtyFlags[data.id] = true
			delegate?.onMessageCreate(data.id, index.get(data.id), [...index.values()])
			scheduleSave()
			return true
		},
		get: Object.assign(get, {
			subscribe: (
				args: Parameters<MessageQueryApi["get"]["subscribe"]>[0],
				callback: Parameters<MessageQueryApi["get"]["subscribe"]>[1]
			) => createSubscribable(() => get(args)).subscribe(callback),
		}) as any,
		getByDefaultAlias: Object.assign(getByDefaultAlias, {
			subscribe: (
				alias: Parameters<MessageQueryApi["getByDefaultAlias"]["subscribe"]>[0],
				callback: Parameters<MessageQueryApi["getByDefaultAlias"]["subscribe"]>[1]
			) => createSubscribable(() => getByDefaultAlias(alias)).subscribe(callback),
		}) as any,
		includedMessageIds: createSubscribable(() => {
			return [...index.keys()]
		}),
		getAll: createSubscribable(() => {
			return [...index.values()]
		}),
		update: ({ where, data }): boolean => {
			const message = index.get(where.id)
			if (message === undefined) return false
			index.set(where.id, { ...message, ...data })
			messageStates.messageDirtyFlags[where.id] = true
			delegate?.onMessageUpdate(where.id, index.get(data.id), [...index.values()])
			scheduleSave()
			return true
		},
		upsert: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) {
				index.set(where.id, data)
				if ("default" in data.alias) {
					defaultAliasIndex.set(data.alias.default, data)
				}
				messageStates.messageDirtyFlags[where.id] = true
				delegate?.onMessageCreate(data.id, index.get(data.id), [...index.values()])
			} else {
				index.set(where.id, { ...message, ...data })
				messageStates.messageDirtyFlags[where.id] = true
				delegate?.onMessageUpdate(data.id, index.get(data.id), [...index.values()])
			}
			scheduleSave()
			return true
		},
		delete: ({ where }): boolean => {
			const message = index.get(where.id)
			if (message === undefined) return false
			if ("default" in message.alias) {
				defaultAliasIndex.delete(message.alias.default)
			}
			index.delete(where.id)
			messageStates.messageDirtyFlags[where.id] = true
			delegate?.onMessageDelete(where.id, [...index.values()])
			scheduleSave()
			return true
		},
	}
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
	messages: Map<string, Message>,
	delegate: MessageQueryDelegate | undefined,
	settingsValue: ProjectSettings,
	resolvedPluginApi: ResolvedPluginApi
) {
	const experimentalAliases = !!settingsValue.experimental?.aliases

	// loading is an asynchronous process - check if another load is in progress - queue this call if so
	if (messageState.isLoading) {
		if (!messageState.sheduledLoadMessagesViaPlugin) {
			messageState.sheduledLoadMessagesViaPlugin = createAwaitable()
		}
		// another load will take place right after the current one - its goingt to be idempotent form the current requested one - don't reschedule
		return messageState.sheduledLoadMessagesViaPlugin.promise
	}

	// set loading flag
	messageState.isLoading = true
	let lockTime: number | undefined = undefined

	try {
		lockTime = await acquireFileLock(fs as NodeishFilesystem, lockDirPath, "loadMessage")
		const loadedMessages = await makeTrulyAsync(
			resolvedPluginApi.loadMessages({
				settings: settingsValue,
				nodeishFs: fs,
			})
		)

		const deletedMessages = new Set(messages.keys())
		batch(() => {
			for (const loadedMessage of loadedMessages) {
				const loadedMessageClone = structuredClone(loadedMessage)

				const currentMessages = [...messages.values()]
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
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length has checked beforhand
					deletedMessages.delete(currentMessages[0]!.id)
					// update message in place - leave message id and alias untouched
					loadedMessageClone.alias = {} as any

					// TODO #1585 we have to map the id of the importedMessage to the alias and fill the id property with the id of the existing message - change when import mesage provides importedMessage.alias
					if (experimentalAliases) {
						loadedMessageClone.alias["default"] = loadedMessageClone.id
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length has checked beforhand
						loadedMessageClone.id = currentMessages[0]!.id
					}

					// NOTE stringifyMessage encodes messages independent from key order!
					const importedEnecoded = stringifyMessage(loadedMessageClone)

					// NOTE could use hash instead of the whole object JSON to save memory...
					if (messageState.messageLoadHash[loadedMessageClone.id] === importedEnecoded) {
						// debug("skipping upsert!")
						continue
					}

					// This logic is preventing cycles - could also be handled if update api had a parameter for who triggered update
					// e.g. when FS was updated, we don't need to write back to FS
					// update is synchronous, so update effect will be triggered immediately
					// NOTE: this might trigger a save before we have the chance to delete - but since save is async and waits for the lock acquired by this method - its save to set the flags afterwards
					messages.set(loadedMessageClone.id, loadedMessageClone)
					// NOTE could use hash instead of the whole object JSON to save memory...
					messageState.messageLoadHash[loadedMessageClone.id] = importedEnecoded
					delegate?.onMessageUpdate(loadedMessageClone.id, loadedMessageClone, [
						...messages.values(),
					])
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
							if (messages.get(messsageId)) {
								currentOffset += 1
								messsageId = undefined
							}
						} while (messsageId === undefined)

						// create a humanId based on a hash of the alias
						loadedMessageClone.id = messsageId
					}

					const importedEnecoded = stringifyMessage(loadedMessageClone)

					// we don't have to check - done before hand if (messages.has(loadedMessageClone.id)) return false
					messages.set(loadedMessageClone.id, loadedMessageClone)
					messageState.messageLoadHash[loadedMessageClone.id] = importedEnecoded
					delegate?.onMessageUpdate(loadedMessageClone.id, loadedMessageClone, [
						...messages.values(),
					])
				}
			}

			for (const deletedMessageId of deletedMessages) {
				messages.delete(deletedMessageId)
				delegate?.onMessageDelete(deletedMessageId, [...messages.values()])
			}
		})
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
		loadMessagesViaPlugin(
			fs,
			lockDirPath,
			messageState,
			messages,
			delegate,
			settingsValue,
			resolvedPluginApi
		)
			.then(() => {
				// resolve the scheduled load message promise
				executingScheduledMessages.resolve()
			})
			.catch((e: Error) => {
				// reject the scheduled load message promise
				executingScheduledMessages.reject(e)
			})
	}
}

async function saveMessagesViaPlugin(
	fs: NodeishFilesystem,
	lockDirPath: string,
	messageState: MessageState,
	messages: Map<string, Message>,
	delegate: MessageQueryDelegate | undefined,
	settingsValue: ProjectSettings,
	resolvedPluginApi: ResolvedPluginApi
): Promise<void> {
	// queue next save if we have a save ongoing
	if (messageState.isSaving) {
		if (!messageState.sheduledSaveMessages) {
			messageState.sheduledSaveMessages = createAwaitable()
		}

		return messageState.sheduledSaveMessages.promise
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

			const currentMessages = [...messages.values()]

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
			await resolvedPluginApi.saveMessages({
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
					messages,
					delegate,
					settingsValue,
					resolvedPluginApi
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
			messages,
			delegate,
			settingsValue,
			resolvedPluginApi
		)
			.then(() => {
				executingSheduledSaveMessages.resolve()
			})
			.catch((e: Error) => {
				executingSheduledSaveMessages.reject(e)
			})
	}
}

type MaybePromise<T> = T | Promise<T>

const makeTrulyAsync = <T>(fn: MaybePromise<T>): Promise<T> => (async () => fn)()

const createAwaitable = () => {
	let resolve: () => void
	let reject: () => void

	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- those properties get set by new Promise, TS can't know this
	return { promise, resolve: resolve!, reject: reject! } as unknown as {
		promise: Promise<void>
		resolve: () => void
		reject: (e: unknown) => void
	}
}

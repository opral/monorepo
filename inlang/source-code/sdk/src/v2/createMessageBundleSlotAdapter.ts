import type { RxCollection, RxReplicationPullStreamItem } from "rxdb"

import _debug from "debug"
import { Subject } from "rxjs"
import { Message, MessageBundle } from "./types/message-bundle.js"
import type createSlotStorage from "../persistence/slotfiles/createSlotStorage.js"
import { replicateRxCollection } from "rxdb/plugins/replication"
import type { SlotEntry } from "../persistence/slotfiles/types/SlotEntry.js"

const debug = _debug("rxdb-adapter")
type MessageUpdate = {
	action: "insert" | "update" | "markDeleted"
	message: Message // You can define a more specific type here if needed
}

function compareMessages(
	upsertedDocument: MessageBundle,
	previousState: MessageBundle
): MessageUpdate[] {
	const updates: MessageUpdate[] = []
	const previousMessagesMap: Map<string, Message> = new Map()

	// Create a map of previous messages for quick lookup
	for (const message of previousState.messages) {
		if (message.id) {
			previousMessagesMap.set(message.id, message)
		}
	}

	// Iterate through the upserted document messages
	for (const message of upsertedDocument.messages) {
		const previousMessage = previousMessagesMap.get(message.id)
		if (previousMessage) {
			if (JSON.stringify(message) !== JSON.stringify(previousMessage)) {
				// TODO fix schema handling
				updates.push({ action: "update", message: message as unknown as Message })
			}
			// Remove from the map to keep track of processed messages
			previousMessagesMap.delete(message.id)
		} else {
			updates.push({ action: "insert", message: message as unknown as Message })
		}
	}

	// Mark remaining messages in the previous state map as deleted
	// previousMessagesMap.forEach((message, id) => {
	//     updates.push({ action: 'markDeleted', message });
	// });

	return updates
}

export const combineToBundles = (
	bundles: SlotEntry<MessageBundle>[],
	messages: SlotEntry<Message>[]
) => {
	debug("loadAllBundles")
	const loadedBundles = new Map<string, MessageBundle>()
	for (const bundle of bundles) {
		loadedBundles.set(bundle.data.id, {
			id: bundle.data.id,
			alias: bundle.data.alias,
			messages: [],
		})
	}

	for (const message of messages) {
		const loadBundle = loadedBundles.get((message.data as any).bundleId)
		if (!loadBundle) {
			console.warn("message without bundle found!" + message.data.bundleId)
			continue
		}

		loadBundle.messages.push(message.data)
	}

	return loadedBundles
}

export function createMessageBundleSlotAdapter(
	bundleStorage: Awaited<ReturnType<typeof createSlotStorage<MessageBundle>>>,
	messageStorage: Awaited<ReturnType<typeof createSlotStorage<Message>>>,
	onBundleChangeCb: (source: "adapter" | "api" | "fs", changedMessageBundle: MessageBundle) => void
) {
	let loadedMessageBundles = new Map<string, MessageBundle>()
	const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>()

	const onBundleChange = (
		source: "adapter" | "api" | "fs",
		changedMessageBundle: MessageBundle
	) => {
		if (source === "fs") {
			// changes comming from fs need to be propagated to the pull stream again
			pullStream$.next({
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- event api sucks atm - we know that we can expect slot entries in records-change event
				documents: [changedMessageBundle],
				// NOTE: we don't need to reconnect a collection at the moment - any checkpoint should work
				checkpoint: {
					now: Date.now(),
				},
			})
		}
		onBundleChangeCb(source, changedMessageBundle)
	}

	const loadAllBundles = async () => {
		debug("loadAllBundles")
		const bundles = await bundleStorage.readAll()

		const messages = await messageStorage.readAll()
		const loadedBundles = combineToBundles(bundles, messages)
		debug("loadAllBundles - " + [...loadedBundles.keys()].length + " budles loaded")
		loadedMessageBundles = loadedBundles
	}

	bundleStorage.setCallback((source, e, bundleRecordIds) => {
		if (e !== "records-change" || !bundleRecordIds) {
			return
		}

		debug(source)

		for (const bundleRecord of bundleStorage.findDocumentsById(bundleRecordIds)) {
			const loaded = loadedMessageBundles.get(bundleRecord.data.id)
			if (loaded) {
				const loadedBundle = structuredClone(loaded)
				loadedBundle.alias = bundleRecord.data.alias
				loadedMessageBundles.set(bundleRecord.data.id, loadedBundle)

				debug("bundle callback - streaming bundle to rxdb " + bundleRecord.data.id)
				onBundleChange(source, loadedBundle)
			} else {
				debug("bundle callback - NOT IMPlEMENTED  add bundle")
			}
		}
	})

	messageStorage.setCallback((source, e, messageRecordIds) => {
		if (e !== "records-change" || !messageRecordIds) {
			return
		}

		debug(source)

		for (const messageRecord of messageStorage.findDocumentsById(messageRecordIds)) {
			const loaded = loadedMessageBundles.get((messageRecord.data as any).bundleId)
			if (loaded) {
				const loadedBundle = structuredClone(loaded)

				let found = false
				let messageIndex = 0
				for (const message of loadedBundle.messages) {
					if (message.id === messageRecord.data.id) {
						loadedBundle.messages[messageIndex] = messageRecord.data as any
						found = true
					}
					messageIndex += 1
				}

				if (!found) {
					loadedBundle.messages.push(messageRecord.data as any)
				}

				loadedMessageBundles.set((messageRecord.data as any).bundleId, loadedBundle)

				debug("message callback - streaming bundle to rxdb " + (messageRecord.data as any).bundleId)
				onBundleChange(source, loadedBundle)
			} else {
				debug("bundle callback - NOT IMPlEMENTED  add MESSAGE")
			}
		}
	})

	const getAllMessageBundles = async () => {
		await loadAllBundles()
		return [...loadedMessageBundles.values()]
	}

	return {
		getAllMessageBundles,
		pullStream$,

		// eslint-disable-next-line @typescript-eslint/no-unused-vars

		pushHandler: async (documentStates: any) => {
			debug("pushHandler called")

			debug("pushHandler calling save to throttle")
			await bundleStorage.save()
			await messageStorage.save()

			const changedBundles = new Set<MessageBundle>()

			for (const doc of documentStates) {
				const upsertedMessageBundle = doc.newDocumentState as unknown as MessageBundle
				const previousStateMessageBundle = doc.assumedMasterState as unknown as MessageBundle

				if (!previousStateMessageBundle) {
					debug("pushHandler called - whole new bundle!")
					// XXX we clear the message array to not introduce a new type here:
					const insertedMessageBundle = structuredClone(upsertedMessageBundle)
					const messagesToInsert = insertedMessageBundle.messages
					insertedMessageBundle.messages = []
					// insert Messages, insert Message Bundle
					bundleStorage.insert(insertedMessageBundle as unknown as MessageBundle, false)
					// add to loadedMessagebundle
					for (const messageToInsert of messagesToInsert) {
						const persistedMessage = messageToInsert as any
						persistedMessage.bundleId = insertedMessageBundle.id
						await messageStorage.insert(messageToInsert as unknown as Message, false)
					}
					loadedMessageBundles.set(upsertedMessageBundle.id, upsertedMessageBundle)

					changedBundles.add(upsertedMessageBundle)
				} else {
					debug("pushHandler called - known message bundle")
					const messageUpdates = compareMessages(upsertedMessageBundle, previousStateMessageBundle)

					const updatedMessageBundle = structuredClone(upsertedMessageBundle)
					updatedMessageBundle.messages = []
					const previousMessageBundle = structuredClone(previousStateMessageBundle)
					previousMessageBundle.messages = []

					let changeFlag = false

					if (JSON.stringify(updatedMessageBundle) !== JSON.stringify(previousMessageBundle)) {
						await bundleStorage.update(updatedMessageBundle as unknown as MessageBundle, false)
						debug("pushHandler called - bundle updated...")
						changeFlag = true
					}
					for (const messageUpdate of messageUpdates) {
						if (messageUpdate.action === "insert") {
							debug("pushHandler called - message inserted...")
							const persistedMessage = messageUpdate.message as any
							persistedMessage.bundleId = updatedMessageBundle.id
							await messageStorage.insert(persistedMessage, false)
							changeFlag = true
						} else if (messageUpdate.action === "update") {
							debug("pushHandler called - message updated...")
							const persistedMessage = messageUpdate.message as any
							persistedMessage.bundleId = updatedMessageBundle.id
							await messageStorage.update(persistedMessage, false)
							changeFlag = true
						}
					}

					if (changeFlag) {
						changedBundles.add(upsertedMessageBundle)
					}
				}
			}

			debug("pushHandler called - persisting storages!")
			await bundleStorage.save()
			await messageStorage.save()
			debug("pushHandler called - persisting storages DONE!!!")

			for (const updatedMessageBundle of changedBundles) {
				onBundleChange("adapter", updatedMessageBundle)
			}

			return []
		},
	}
}

export function startReplication(
	messageBundleCollection: RxCollection,
	adapter: ReturnType<typeof createMessageBundleSlotAdapter>
) {
	return replicateRxCollection({
		collection: messageBundleCollection,
		/**
		 * An id for the replication to identify it
		 * and so that RxDB is able to resume the replication on app reload.
		 * If you replicate with a remote server, it is recommended to put the
		 * server url into the replicationIdentifier.
		 */
		replicationIdentifier: "my-rest-replication-to-https://example.com/api/syncs",
		/**
		 * By default it will do an ongoing realtime replication.
		 * By settings live: false the replication will run once until the local state
		 * is in sync with the remote state, then it will cancel itself.
		 * (optional), default is true.
		 */
		live: true,
		/**
		 * Time in milliseconds after when a failed backend request
		 * has to be retried.
		 * This time will be skipped if a offline->online switch is detected
		 * via navigator.onLine
		 * (optional), default is 5 seconds.
		 */
		retryTime: 5 * 1000,
		/**
		 * When multiInstance is true, like when you use RxDB in multiple browser tabs,
		 * the replication should always run in only one of the open browser tabs.
		 * If waitForLeadership is true, it will wait until the current instance is leader.
		 * If waitForLeadership is false, it will start replicating, even if it is not leader.
		 * [default=true]
		 */
		waitForLeadership: false,
		/**
		 * If this is set to false,
		 * the replication will not start automatically
		 * but will wait for replicationState.start() being called.
		 * (optional), default is true
		 */
		autoStart: true,

		/**
		 * Custom deleted field, the boolean property of the document data that
		 * marks a document as being deleted.
		 * If your backend uses a different fieldname then '_deleted', set the fieldname here.
		 * RxDB will still store the documents internally with '_deleted', setting this field
		 * only maps the data on the data layer.
		 *
		 * If a custom deleted field contains a non-boolean value, the deleted state
		 * of the documents depends on if the value is truthy or not. So instead of providing a boolean * * deleted value, you could also work with using a 'deletedAt' timestamp instead.
		 *
		 * [default='_deleted']
		 */
		deletedField: "deleted",

		/**
		 * Optional,
		 * only needed when you want to replicate local changes to the remote instance.
		 */
		push: {
			/**
			 * Push handler
			 */
			handler: adapter.pushHandler,
			/**
			 * Batch size, optional
			 * Defines how many documents will be given to the push handler at once.
			 */
			// batchSize: 0,
			/**
			 * Modifies all documents before they are given to the push handler.
			 * Can be used to swap out a custom deleted flag instead of the '_deleted' field.
			 * If the push modifier return null, the document will be skipped and not send to the remote.
			 * Notice that the modifier can be called multiple times and should not contain any side effects.
			 * (optional)
			 */
			modifier: (d) => d,
		},
		/**
		 * Optional,
		 * only needed when you want to replicate remote changes to the local state.
		 */
		pull: {
			/**
			 * Pull handler
			 */
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			handler: async (lastCheckpoint: any, _batchSize: number) => {
				debug("pullHandler called")
				let changedDocuments = [] as any[]
				if (!lastCheckpoint) {
					debug("pullHandler called - first checkpoint load all bundles...")
					changedDocuments = await adapter.getAllMessageBundles()
					debug(
						"pullHandler called - first checkpoint load all bundles..." +
							changedDocuments.length +
							" loaded"
					)
				}

				const documentsToResponse = changedDocuments.map((se) => se) as any[]
				debug("pullHandler called - returning " + documentsToResponse.length)
				// const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0
				// /**
				//  * In this example we replicate with a remote REST server
				//  */
				// const response = await fetch(
				// 	`https://example.com/api/sync/?minUpdatedAt=${minTimestamp}&limit=${batchSize}`
				// )
				// const documentsFromRemote = await response.json()
				return {
					/**
					 * Contains the pulled documents from the remote.
					 * Not that if documentsFromRemote.length < batchSize,
					 * then RxDB assumes that there are no more un-replicated documents
					 * on the backend, so the replication will switch to 'Event observation' mode.
					 */
					documents: documentsToResponse,
					/**
					 * The last checkpoint of the returned documents.
					 * On the next call to the pull handler,
					 * this checkpoint will be passed as 'lastCheckpoint'
					 */
					checkpoint: {
						now: Date.now(),
					},
					/*documentsFromRemote.length === 0
							? lastCheckpoint
							: {
									id: lastOfArray(documentsFromRemote).id,
									updatedAt: lastOfArray(documentsFromRemote).updatedAt,
							  },*/
				}
			},
			// batchSize: 10,
			/**
			 * Modifies all documents after they have been pulled
			 * but before they are used by RxDB.
			 * Notice that the modifier can be called multiple times and should not contain any side effects.
			 * (optional)
			 */
			modifier: (d) => d,
			/**
			 * Stream of the backend document writes.
			 * See below.
			 * You only need a stream$ when you have set live=true
			 */
			stream$: adapter.pullStream$.asObservable(),
		},
	})
}

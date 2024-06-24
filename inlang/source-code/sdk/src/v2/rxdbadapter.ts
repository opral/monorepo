import type { RxCollection, RxReplicationPullStreamItem } from "rxdb"

import _debug from "debug"
import { Subject } from "rxjs"
import type { Message, MessageBundle } from "./types/message-bundle.js"
import type createSlotStorage from "../persistence/slotfiles/createSlotStorage.js"
import { replicateRxCollection } from "rxdb/plugins/replication"

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

export function createRxDbAdapter(
	bundleStorage: ReturnType<typeof createSlotStorage<MessageBundle>>,
	messageStorage: ReturnType<typeof createSlotStorage<Message>>
) {
	const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>()
	let loadedMessageBundles = new Map<string, MessageBundle>()

	const loadAllBundles = async () => {
		debug("loadAllBundles")
		const loadedBundles = new Map<string, MessageBundle>()
		const bundles = await bundleStorage.readAll()
		for (const bundle of bundles) {
			loadedBundles.set(bundle.data.id, {
				id: bundle.data.id,
				alias: bundle.data.alias,
				messages: [],
			})
		}

		const messages = await messageStorage.readAll()
		for (const message of messages) {
			const loadBundle = loadedBundles.get((message.data as any).bundleId)
			if (!loadBundle) {
				console.warn("message without bundle found!" + message.data.bundleId)
				continue
			}

			loadBundle.messages.push(message.data)
		}

		debug("loadAllBundles - " + [...loadedBundles.keys()].length + " budles loaded")
		loadedMessageBundles = loadedBundles
	}

	bundleStorage.setCallback((e, bundleRecordIds) => {
		if (e !== "records-change" || !bundleRecordIds) {
			return
		}

		for (const bundleRecord of bundleStorage.findDocumentsById(bundleRecordIds)) {
			const loaded = loadedMessageBundles.get(bundleRecord.data.id)
			if (loaded) {
				const loadedBundle = structuredClone(loaded)
				loadedBundle.alias = bundleRecord.data.alias
				loadedMessageBundles.set(bundleRecord.data.id, loadedBundle)

				debug("bundle callback - streaming bundle to rxdb " + bundleRecord.data.id)
				pullStream$.next({
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- event api sucks atm - we know that we can expect slot entries in records-change event
					documents: [loadedBundle],
					// NOTE: we don't need to reconnect a collection at the moment - any checkpoint should work
					checkpoint: {
						now: Date.now(),
					},
				})
			} else {
				debug("bundle callback - NOT IMPlEMENTED  add bundle")
			}
		}
	})

	messageStorage.setCallback((e, messageRecordIds) => {
		if (e !== "records-change" || !messageRecordIds) {
			return
		}

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
				pullStream$.next({
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- event api sucks atm - we know that we can expect slot entries in records-change event
					documents: [loadedBundle],
					// NOTE: we don't need to reconnect a collection at the moment - any checkpoint should work
					checkpoint: {
						now: Date.now(),
					},
				})
			} else {
				debug("bundle callback - NOT IMPlEMENTED  add MESSAGE")
			}
		}
	})

	return {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		pullHandler: async (lastCheckpoint: any, _batchSize: number) => {
			debug("pullHandler called")
			let changedDocuments = [] as any[]
			if (!lastCheckpoint) {
				debug("pullHandler called - first checkpoint load all bundles...")
				await loadAllBundles()
				changedDocuments = [...loadedMessageBundles.values()]
				debug(
					"pullHandler called - first checkpoint load all bundles..." +
						changedDocuments.length +
						" loaded"
				)
			}

			const documentsToRespnse = changedDocuments.map((se) => se)
			debug("pullHandler called - returning " + documentsToRespnse.length)
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
				documents: documentsToRespnse,
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
		pushHandler: async (documentStates: any) => {
			debug("pushHandler called")

			debug("pushHandler calling save to throttle")
			await bundleStorage.save()
			await messageStorage.save()

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
					bundleStorage.insert(insertedMessageBundle as unknown as MessageBundle)
					// add to loadedMessagebundle
					for (const messageToInsert of messagesToInsert) {
						const persistedMessage = messageToInsert as any
						persistedMessage.bundleId = insertedMessageBundle.id
						messageStorage.insert(messageToInsert as unknown as Message)
					}
					loadedMessageBundles.set(upsertedMessageBundle.id, upsertedMessageBundle)
				} else {
					debug("pushHandler called")
					const messageUpdates = compareMessages(upsertedMessageBundle, previousStateMessageBundle)

					const updatedMessageBundle = structuredClone(upsertedMessageBundle)
					updatedMessageBundle.messages = []
					const previousMessageBundle = structuredClone(previousStateMessageBundle)
					previousMessageBundle.messages = []

					if (JSON.stringify(updatedMessageBundle) !== JSON.stringify(previousMessageBundle)) {
						bundleStorage.update(updatedMessageBundle as unknown as MessageBundle)
						debug("pushHandler called - bundle updated...")
					}
					for (const messageUpdate of messageUpdates) {
						if (messageUpdate.action === "insert") {
							debug("pushHandler called - message inserted...")
							const persistedMessage = messageUpdate.message as any
							persistedMessage.bundleId = updatedMessageBundle.id
							messageStorage.insert(persistedMessage)
						} else if (messageUpdate.action === "update") {
							debug("pushHandler called - message updated...")
							const persistedMessage = messageUpdate.message as any
							persistedMessage.bundleId = updatedMessageBundle.id
							messageStorage.update(persistedMessage)
						}
					}
				}
			}

			debug("pushHandler called - persisting storages!")
			await bundleStorage.save()
			await messageStorage.save()

			return []
		},
		pullStream$,
	}
}

export function startReplication(
	messageBundleCollection: RxCollection,
	adapter: ReturnType<typeof createRxDbAdapter>
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
			handler: adapter.pullHandler,
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

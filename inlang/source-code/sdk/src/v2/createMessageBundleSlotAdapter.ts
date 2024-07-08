import {
	deepEqual,
	type RxCollection,
	type RxConflictHandler,
	type RxConflictHandlerInput,
	type RxConflictHandlerOutput,
	type RxReplicationPullStreamItem,
} from "rxdb"

import _debug from "debug"
import { Subject } from "rxjs"
import {
	Message,
	MessageBundle,
	MessageBundleRecord,
	MessageRecord,
	MessageWithConflictMarkers,
} from "./types/message-bundle.js"
import { replicateRxCollection } from "rxdb/plugins/replication"
import type { SlotEntry } from "../persistence/slotfiles/types/SlotEntry.js"
import type createSlotWriter from "../persistence/slotfiles/createSlotWriter.js"
import type { LintReport, LintResult } from "./types/lint.js"

const debug = _debug("rxdb-adapter")
type MessageUpdate = {
	action: "insert" | "update" | "markDeleted"
	message: Message // You can define a more specific type here if needed
}

/**
 * receives two states of the same MessageBundle and extracts updates/inserts of messages within the bundle
 * @param upsertedDocument
 * @param previousState
 * @returns
 */
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

function recordToMessage(message: SlotEntry<MessageRecord>) {
	return {
		...message.data,
		mergeConflict: message.mergeConflict
			? {
					...message.mergeConflict.data,
					versionHash: message.mergeConflict.hash,
			  }
			: undefined,
		versionHash: message.slotEntryHash,
	}
}

function messageBundleToMessageBundleRecord(messageBundle: MessageBundle) {
	const messageBundleRecord: MessageBundleRecord = {
		id: messageBundle.id,
		alias: structuredClone(messageBundle.alias),
	}

	return messageBundleRecord
}

export const combineToBundles = (
	bundles: SlotEntry<MessageBundleRecord>[],
	messages: SlotEntry<MessageRecord>[]
) => {
	debug("loadAllBundles")
	const loadedBundles = new Map<string, MessageBundle>()
	for (const bundleSlotEntry of bundles) {
		loadedBundles.set(bundleSlotEntry.data.id, {
			id: bundleSlotEntry.data.id,
			alias: bundleSlotEntry.data.alias,
			versionHash: bundleSlotEntry.hash,
			messages: [],
		})
	}

	for (const message of messages) {
		const loadBundle = loadedBundles.get((message.data as any).bundleId)
		if (!loadBundle) {
			console.warn("message without bundle found!" + message.data.bundleId)
			continue
		}
		const bundleMessage: MessageWithConflictMarkers = recordToMessage(message)

		loadBundle.messages.push(bundleMessage)
	}

	return loadedBundles
}

export function createMessageBundleSlotAdapter(
	bundleStorage: Awaited<ReturnType<typeof createSlotWriter<MessageBundleRecord>>>,
	messageStorage: Awaited<ReturnType<typeof createSlotWriter<MessageRecord>>>,
	onBundleChangeCb: (source: "adapter" | "api" | "fs", changedMessageBundle: MessageBundle) => void,
	lintResults?: Subject<LintResult>
) {
	let loadedMessageBundles = new Map<string, MessageBundle>()
	const loadedMessageBundleLintReports = new Map<
		string,
		{
			hash: string
			reports: LintReport[]
		}
	>()

	const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>()

	const onBundleChange = (
		source: "adapter" | "api" | "fs",
		changedMessageBundle: MessageBundle
	) => {
		// if (source === "fs") {
		// changes comming from fs need to be propagated to the pull stream again
		pullStream$.next({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- event api sucks atm - we know that we can expect slot entries in records-change event
			documents: [changedMessageBundle],
			// NOTE: we don't need to reconnect a collection at the moment - any checkpoint should work
			checkpoint: {
				now: Date.now(),
			},
		})
		// }
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

		for (const bundleRecord of bundleStorage.findByIds(bundleRecordIds)) {
			const loaded = loadedMessageBundles.get(bundleRecord.data.id)
			if (loaded) {
				const loadedBundle = structuredClone(loaded)
				loadedBundle.versionHash = bundleRecord.slotEntryHash
				loadedBundle.alias = bundleRecord.data.alias
				loadedMessageBundles.set(bundleRecord.data.id, loadedBundle)

				debug("bundle callback - streaming bundle to rxdb " + bundleRecord.data.id)
			} else {
				const loadedBundle: MessageBundle = {
					id: bundleRecord.data.id,
					alias: bundleRecord.data.alias,
					messages: [],
				}
				loadedBundle.versionHash = bundleRecord.slotEntryHash
				loadedBundle.alias = bundleRecord.data.alias
				loadedMessageBundles.set(bundleRecord.data.id, loadedBundle)
				onBundleChange(source, loadedBundle)
			}
		}
	})

	messageStorage.setCallback((source, e, messageRecordIds) => {
		if (e !== "records-change" || !messageRecordIds) {
			return
		}
		debug(source)

		for (const messageRecord of messageStorage.findByIds(messageRecordIds)) {
			const loaded = loadedMessageBundles.get((messageRecord.data as any).bundleId)
			if (loaded) {
				const loadedBundle = structuredClone(loaded)

				let found = false
				let messageIndex = 0
				for (const message of loadedBundle.messages) {
					if (message.id === messageRecord.data.id) {
						loadedBundle.messages[messageIndex] = recordToMessage(messageRecord)
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

	lintResults?.subscribe((reportResults) => {
		// for now we assume that messages exist before the reports
		for (const [bundleId, bundle] of loadedMessageBundles) {
			const currentReports = reportResults[bundleId]
			if (reportResults[bundleId]!.hash !== loadedMessageBundleLintReports.get(bundleId)?.hash) {
				if (currentReports) {
					loadedMessageBundleLintReports.set(bundleId, currentReports)
				} else {
					loadedMessageBundleLintReports.delete(bundleId)
				}
				const clonedBundle = structuredClone(bundle)
				clonedBundle.lintReports = currentReports ?? { hash: "", reports: [] }
				loadedMessageBundles.set(bundleId, clonedBundle)
				onBundleChange("fs", clonedBundle)
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
		conflictHandler,

		// eslint-disable-next-line @typescript-eslint/no-unused-vars

		pushHandler: async (documentStates: any) => {
			debug("pushHandler called")

			debug("pushHandler calling save to throttle")
			// TODO SDK 2 fix serializatio
			await bundleStorage.save()
			await messageStorage.save()

			const changedBundles = new Set<MessageBundle>()

			for (const doc of documentStates) {
				const upsertedMessageBundle = doc.newDocumentState as unknown as MessageBundle
				const previousStateMessageBundle = doc.assumedMasterState as unknown as MessageBundle

				if (!previousStateMessageBundle) {
					debug("pushHandler called - whole new bundle!")

					const insertedMessageBundle = messageBundleToMessageBundleRecord(upsertedMessageBundle)
					const messagesToInsert = upsertedMessageBundle.messages as Message[]

					// insert Messages, insert Message Bundle
					await bundleStorage.insert({ document: insertedMessageBundle, saveToDisk: false })
					// add to loadedMessagebundle
					for (const messageToInsert of messagesToInsert) {
						const messageRecord: MessageRecord = {
							id: messageToInsert.id,
							bundleId: insertedMessageBundle.id,
							locale: messageToInsert.locale,
							declarations: structuredClone(messageToInsert.declarations),
							variants: structuredClone(messageToInsert.variants),
							selectors: structuredClone(messageToInsert.selectors),
						}

						await messageStorage.insert({ document: messageRecord, saveToDisk: false })
					}
					loadedMessageBundles.set(upsertedMessageBundle.id, upsertedMessageBundle)

					changedBundles.add(upsertedMessageBundle)
				} else {
					debug("pushHandler called - known message bundle")
					// TODO SDK2 take conflict handling into account!
					const messageUpdates = compareMessages(upsertedMessageBundle, previousStateMessageBundle)

					const updatedMessageBundle = messageBundleToMessageBundleRecord(upsertedMessageBundle)
					const previousMessageBundle = messageBundleToMessageBundleRecord(
						previousStateMessageBundle
					)

					let changeFlag = false

					if (JSON.stringify(updatedMessageBundle) !== JSON.stringify(previousMessageBundle)) {
						await bundleStorage.update({
							document: updatedMessageBundle as MessageBundleRecord,
							saveToDisk: false,
						})
						debug("pushHandler called - bundle updated...")
						changeFlag = true
					}
					for (const messageUpdate of messageUpdates) {
						if (messageUpdate.action === "insert") {
							debug("pushHandler called - message inserted...")
							const messageToInsert = messageUpdate.message

							const messageRecord: MessageRecord = {
								id: messageToInsert.id,
								bundleId: updatedMessageBundle.id,
								locale: messageToInsert.locale,
								declarations: structuredClone(messageToInsert.declarations),
								variants: structuredClone(messageToInsert.variants),
								selectors: structuredClone(messageToInsert.selectors),
							}
							await messageStorage.insert({ document: messageRecord, saveToDisk: false })
							changeFlag = true
						} else if (messageUpdate.action === "update") {
							debug("pushHandler called - message updated...")
							const messageToUpdate = messageUpdate.message

							const messageRecord: MessageRecord = {
								id: messageToUpdate.id,
								bundleId: updatedMessageBundle.id,
								locale: messageToUpdate.locale,
								declarations: structuredClone(messageToUpdate.declarations),
								variants: structuredClone(messageToUpdate.variants),
								selectors: structuredClone(messageToUpdate.selectors),
							}
							await messageStorage.update({ document: messageRecord, saveToDisk: false })
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

const conflictHandler: RxConflictHandler<any> = function (
	i: RxConflictHandlerInput<any>,
	context: string
): Promise<RxConflictHandlerOutput<any>> {
	// console.log("defaultConflictHandler")
	// console.log(context)
	// const newDocumentState = i.newDocumentState as undefined | MessageBundle

	// const assumedMasterState = i.assumedMasterState as undefined | MessageBundle

	// console.log("newDocumentState", newDocumentState)
	// console.log("realMasterState", i.realMasterState)
	// console.log("assumedMasterState", assumedMasterState)

	// if (context === "downstream-check-if-equal-0") {
	// 	// its a downstream change - we can expect a realMasterState
	// 	const realMasterState = i.realMasterState as MessageBundle
	// 	const newDocumentState = i.newDocumentState as MessageBundle

	// 	// let resolvedDocument: MessageBundle | undefinend

	// 	// integrate changes from the master into the fork
	// 	if (newDocumentState.lintReports?.hash !== realMasterState.lintReports?.hash) {
	// 		console.log('integrating lints')
	// 		// always use lints from master - client doesnt write those
	// 		newDocumentState.lintReports = realMasterState?.lintReports
	// 	}

	// 	if (newDocumentState.versionHash !== realMasterState.versionHash) {
	// 		newDocumentState.alias = realMasterState.alias
	// 	}

	// 	// if (newDocumentState.messages)
	// 	return Promise.resolve({
	// 		isEqual: false,
	// 		documentData: i.newDocumentState,
	// 	})
	// } else if (context === "upstream-check-if-equal") {
	// 	// XXX FOR NOW integrate changes from the fork into the master
	// 	return Promise.resolve({
	// 		isEqual: false,
	// 		documentData: i.realMasterState,
	// 	})
	// }

	// return Promise.resolve({
	// 	isEqual: true,
	// })

	/**
	 * Here we detect if a conflict exists in the first place.
	 * If there is no conflict, we return isEqual=true.
	 * If there is a conflict, return isEqual=false.
	 * In the default handler we do a deepEqual check,
	 * but in your custom conflict handler you probably want
	 * to compare specific properties of the document, like the updatedAt time,
	 * for better performance because deepEqual() is expensive.
	 */
	if (deepEqual(i.newDocumentState, i.realMasterState)) {
		return Promise.resolve({
			isEqual: true,
		})
	}

	/**
	 * If a conflict exists, we have to resolve it.
	 * The default conflict handler will always
	 * drop the fork state and use the master state instead.
	 *
	 * In your custom conflict handler you likely want to merge properties
	 * of the realMasterState and the newDocumentState instead.
	 */
	return Promise.resolve({
		isEqual: false,
		documentData: i.realMasterState,
	})
}

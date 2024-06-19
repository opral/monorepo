import { createRxDatabase, addRxPlugin, RxReplicationPullStreamItem } from "rxdb"
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder"
import { getRxStorageMemory } from "rxdb/plugins/storage-memory"
import { replicateRxCollection } from "rxdb/plugins/replication"
import createSlotStorage from "../../../src/persistence/slotfiles/createSlotStorage.js"
import { createNodeishMemoryFs } from "@lix-js/client"
import http from "isomorphic-git/http/web"
import { Subject } from "rxjs"

// NOTE: I use isomorphic git because i went crazy with cors :-/ was faster to spin up a iso proxy
import git, { pull, add, commit, push, statusMatrix } from "isomorphic-git"
const fs = createNodeishMemoryFs()

import { MessageBundleRx, MyBundleCollections } from "./schema-messagebundle.js"
import { Message, MessageBundle } from "../../../src/v2/types.js"
import { createRxDbAdapter } from "./rxdbadapter.js"

addRxPlugin(RxDBQueryBuilderPlugin)

// NOTE: All those properties are hardcoded for now - dont get crazy ;-) #POC
const gittoken = "YOUR_GITHUB_TOKEN_HERE"
const corsProxy = "http://localhost:9998" // cors Proxy expected to run - start it via pnpm run proxy
const repoUrl = "https://github.com/martin-lysk/message-bundle-storage"
const dir = "/"

// path to the folder where the slotfiles for the collection will be stored
const bundleCollectionDir = dir + "messageBundle/"
const messageCollectionDir = dir + "messages/"

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

const _create = async (fs: any) => {
	await git.clone({
		fs: fs,
		http,
		dir: dir,
		corsProxy: corsProxy,
		url: repoUrl,
		singleBranch: true,
		depth: 1,
	})
	const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>()

	// create a slot storage that informs rxdb via pullStream about changes in records
	//const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>()
	const bundleStorage = createSlotStorage<MessageBundle>(
		"bundle-storage",
		// use 65536 slots per slot file
		16 * 16 * 16 * 16,
		3
	)

	const messageStorage = createSlotStorage<Message>(
		"message-storage",
		// use 65536 slots per slot file
		16 * 16 * 16 * 16,
		3
	)

	// connect the storage with the collection dir (will read all slot files and load all documents into memory)
	await bundleStorage.connect(fs, bundleCollectionDir)
	await messageStorage.connect(fs, messageCollectionDir)

	// rxdb with memory storage configured
	const database = await createRxDatabase<MyBundleCollections>({
		name: "rxdbdemo",
		storage: getRxStorageMemory(),
		password: "foooooobaaaaar",
		// deactivate inter browser tab optimization
		multiInstance: true,
		ignoreDuplicate: true,
	})

	// add the hero collection
	const collection = await database.addCollections({ messageBundles: { schema: MessageBundleRx } })

	const messageBundleStorageAdapter = createRxDbAdapter(bundleStorage, messageStorage, pullStream$)

	// now setup the replication for the hero collection - i kept comments from https://rxdb.info/replication.html
	// important code sits in:
	// push - called when documents are updated in rxDb and upsers docs in slot storage
	// pull - only used initially to load all records from slots to rx db (this POC - does not implement the disconnect/reconnect state - may be usefull for branch switches)
	// streams$ - the observable we pipe changes within slotstorage to rxDB - when we pull and files change
	const replicationState = replicateRxCollection({
		collection: collection.messageBundles,
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
			handler: messageBundleStorageAdapter.pushHandler,
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
			handler: messageBundleStorageAdapter.pullHandler,
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
			stream$: pullStream$.asObservable(),
		},
	})

	await replicationState.awaitInitialReplication()

	const pullChangesAndReloadSlots = async () => {
		await pull({
			fs,
			http,
			dir: dir,
			author: {
				email: "user@user.de",
				name: "Meeee",
			},
		})
		await bundleStorage.loadSlotFilesFromWorkingCopy(true)
		await messageStorage.loadSlotFilesFromWorkingCopy(true)
	}

	const pushChangesAndReloadSlots = async () => {
		await push({
			fs,
			http,
			dir,
			onAuth: () => {
				return { username: gittoken }
			},
		})
		await bundleStorage.loadSlotFilesFromWorkingCopy(true)
		await messageStorage.loadSlotFilesFromWorkingCopy(true)
	}

	let ongoingCommit = undefined as any

	const commitChanges = async () => {
		if (ongoingCommit) {
			await ongoingCommit.then(commitChanges)
			return
		}

		const awaitable = createAwaitable()
		ongoingCommit = awaitable[0]
		const done = awaitable[1]

		const FILE = 0,
			WORKDIR = 2,
			STAGE = 3
		const filenames = (
			await statusMatrix({
				dir: dir,
				fs: fs,
			})
		)
			.filter((row) => row[WORKDIR] !== row[STAGE])
			.map((row) => row[FILE])

		if (filenames.length == 0) {
			return
		}

		await add({
			dir: dir,
			fs: fs,
			filepath: filenames,
		})

		try {
			await commit({
				dir: dir,
				fs: fs,
				message: "db commit",
				author: {
					email: "test@test.te",
					name: "jojo",
				},
			})
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e)
		}
		ongoingCommit = undefined
		done()
	}

	return { database, fs, pullChangesAndReloadSlots, pushChangesAndReloadSlots, commitChanges }
}

export const storage = _create(fs)

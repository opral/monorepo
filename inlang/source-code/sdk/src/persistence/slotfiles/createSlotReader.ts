import type { NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
import type { SlotEntry } from "./types/SlotEntry.js"
import { createBlobOid, hashString } from "./utill/hash.js"
import { parseSlotFile } from "./utill/parseSlotFile.js"
import type { SlotFileStates } from "./types/SlotFileStates.js"
import type { SlotFile } from "./types/SlotFile.js"
import type { HasId } from "./types/HasId.js"
import { deepFreeze } from "./utill/deepFreeze.js"
import { openRepository } from "@lix-js/client"

type FsType<Watch extends boolean> = Watch extends true
	? Pick<NodeishFilesystem, "readFile" | "readdir" | "watch">
	: Pick<NodeishFilesystem, "readFile" | "readdir">

interface CommonParams {
	path: string
}

interface WatchingReadonlyParams extends CommonParams {
	watch: true
	fs: FsType<true>
}

interface NonWatchingReadonlyParams extends CommonParams {
	watch: false
	fs: FsType<false>
}

type createSlotStorageParams = NonWatchingReadonlyParams | WatchingReadonlyParams

/**
 *
 * The storage has three stages:
 *
 * Stage I: Memory
 * Stage II: Working copy
 * Stage III: Git Commit
 *
 * Data/Changes can flow in both directions.
 *
 * Happy Path:
 *
 * Data Flowing down from Memory down to a git commit:
 *
 * Document Creation:
 *
 * 1. a record gets created using insert()
 *  -> record is held in memory as transient record
 * 2. a (batched) or explicit call to save() picks up the transient object
 *  -> record is put into a free slot within the working copy file and saved to disc
 * 3. the working should get commmited useing commit()
 *  -> git creates the lose object and corresponding commit
 *
 * A conflict can only occur on slot collision*.
 *
 * Document Update:
 *
 * 1. a record gets updated
 * -> a copied of the current record is added to changedRecords of the slotFile object with the changes applied
 * -> OR if the record is a transient record the transient record is replaced with the updated state
 * 2. a (batched) or explicit call to save() picks up the transient object
 * TODO continue description
 *
 * A record can get created in memory
 *  from a higher stage Records can com If you create an object it would be stored in memory as a
 * transient record.
 *
 * @param fs nodeFs to use for persistence
 * @param path base path to store each collection in
 * @returns
 */
export default async function createSlotStorageReader<DocType extends HasId>({
	/* git - thoughts: if we pass the git object we can check if the staging/head and working differ, 
		- if the current commit changes we walk the tree of the current commit to find differences in the slot files
		
		- changes between two commit, between the working copy and the head
		
		- if this is the case: we have uncommited changes
		  - a slot may differ

	 */
	fs,
	path,
	watch,
}: createSlotStorageParams) {
	const debug = _debug("sdk:slotfile:" + path)
	// property to use to test for identity of an object within a collection
	// NOTE: use schema primary key like in https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106
	const idProperty = "id"

	const idToSlotFileName = new Map<string, string>()

	// appended or update insert
	const fileNamesToSlotfileStates = new Map<string, SlotFileStates<DocType>>()

	let changeCallback: (
		source: "api" | "fs",
		eventName: string,
		records?: string[]
	) => void = () => {}

	const slotEntryStates = new Map<string, SlotEntry<DocType>>()

	/**
	 *
	 * Merges the updated Slotfile into the current Slotfile
	 * - integrates records present in local changes that do not conflict with current disc state
	 * - keeps localy conflicting records (those having local changes and updated in updatedSlotfileState) untouched
	 *
	 * NOTE: while local conflicts can not exist without changes - the reader might run within a writer
	 *
	 *
	 * @param currentSlotFileState
	 * @param freshSlotFileState
	 * @param localChanges
	 */
	const mergeRecordsWithoutLocalConflicts = (
		currentSlotFileState: SlotFile<DocType>,
		freshSlotFileState: SlotFile<DocType>,
		localChanges: (SlotEntry<DocType> | null)[]
	) => {
		const mergedState = structuredClone(currentSlotFileState)
		const conflictingSlotIndexes: number[] = []
		const updatedSlotIndexes: number[] = []
		const createdSlotIndexes: number[] = []

		const maxSlotsPerFile = Math.max(
			currentSlotFileState.recordSlots.length,
			Math.max(freshSlotFileState.recordSlots.length, localChanges.length)
		)

		// content of a slotfile has changed we need to check each record
		for (let currentSlotIndex = 0; currentSlotIndex <= maxSlotsPerFile; currentSlotIndex += 1) {
			const loadedSlotEntry = currentSlotFileState.recordSlots[currentSlotIndex]
			const freshSlotEntry = freshSlotFileState.recordSlots[currentSlotIndex]

			const changedRecord = localChanges[currentSlotIndex]

			if (!loadedSlotEntry && !changedRecord && !freshSlotEntry) {
				// no record in slot - NoOp
				// debug("mergeRecordsWithoutLocalConflicts - no record in slot")
			} else if (
				loadedSlotEntry &&
				freshSlotEntry &&
				loadedSlotEntry.slotEntryHash === freshSlotEntry.slotEntryHash
			) {
				// nothing new from the loaded file for this record
				// - no op
				debug(
					"mergeRecordsWithoutLocalConflicts - file and memory same state - " + currentSlotIndex
				)
			} else if (
				loadedSlotEntry &&
				freshSlotEntry &&
				loadedSlotEntry.slotEntryHash !== freshSlotEntry.slotEntryHash
			) {
				if (!changedRecord) {
					debug(
						"mergeRecordsWithoutLocalConflicts - nothin changed in memory - no conflict - use fresh loaded state... - " +
							currentSlotIndex
					)
					// nothin changed in memory - no conflict - use fresh loaded state...
					mergedState.recordSlots[currentSlotIndex] = freshSlotEntry
					updatedSlotIndexes.push(currentSlotIndex)
				} else if (changedRecord) {
					debug(
						"mergeRecordsWithoutLocalConflicts - the record has changed in memory - and the data loaded from working copy has changed - keep memory origin and the memory untouched... - " +
							currentSlotIndex
					)
					// the record has changed in memory - and the data loaded from working copy has changed - keep memory origin and the memory untouched
					conflictingSlotIndexes.push(currentSlotIndex)
					mergedState.contentHash = "conflicting"
				}
			} else if (!loadedSlotEntry && freshSlotEntry) {
				if (!changedRecord) {
					debug(
						"mergeRecordsWithoutLocalConflicts - record found in update slotfile that didnt exist in memory yet... - " +
							currentSlotIndex
					)
					// record found in update slotfile that didn
					mergedState.recordSlots[currentSlotIndex] = freshSlotEntry
					createdSlotIndexes.push(currentSlotIndex)
				} else {
					throw new Error("record created in slot file conflicts with loaded record in slot")
				}
			} else if (loadedSlotEntry && !freshSlotEntry) {
				// NOTE: working file seem to have change to an older version that didn't know about the entry in the slot?
				throw new Error("record does not exit in slot file anymore")
			}
		}

		if (mergedState.contentHash != "conflicting") {
			mergedState.contentHash = freshSlotFileState.contentHash
		} else {
			// TODO calculate new memory hash
		}

		return {
			mergedState,
			conflictingSlotIndexes,
			updatedSlotIndexes,
			createdSlotIndexes,
		}
	}

	const loadSlotFileFromFs = async (slotFileName: string) => {
		debug("loadSlotFileFromFs " + slotFileName)
		// NOTE: we can use lix to check if the current file is conflicting and load the conflicting state
		const statesBefore = fileNamesToSlotfileStates.get(slotFileName)

		if (statesBefore && statesBefore.stateFlag !== "loadrequested") {
			debug(`loadSlotFileFromFs ${slotFileName} skipped state was ${statesBefore.stateFlag}`)
			return undefined
		}

		if (statesBefore) {
			statesBefore.stateFlag = "loading"
		}

		const slotFileContent = await fs.readFile(path + slotFileName + ".slot")
		const slotFileContentHash = await createBlobOid(slotFileContent)

		if (
			statesBefore &&
			(statesBefore.memorySlotFileState?.contentHash === slotFileContentHash ||
				statesBefore.fsSlotFileState?.contentHash === slotFileContentHash)
		) {
			debug("loadSlotFileFromWorkingCopy " + slotFileName + " hash was equal state -> loaded")
			statesBefore.stateFlag = "loaded"
			// content is equal - no further loading needed
			return undefined
		}

		const decoder = new TextDecoder("utf-8")
		const jsonString = decoder.decode(slotFileContent)
		const slotFileContentParsed = await parseSlotFile<DocType>(jsonString)

		const freshSlotfile: SlotFile<DocType> = {
			contentHash: slotFileContentHash,
			exists: true,
			recordSlots: slotFileContentParsed,
		}

		if (!statesBefore) {
			// Load new, yet unknown slot file to memory

			const result = {
				upsertedSlotFileStates: {
					slotFileName: slotFileName,
					fsSlotFileState: undefined,
					// TODO make sure we reload load the slotfile states for new files comming from git
					headSlotfileState: undefined,
					stateFlag: "loaded" as const,
					memorySlotFileState: freshSlotfile,
					changedRecords: [],
				} as SlotFileStates<DocType>,
				created: [] as number[],
				updated: [] as number[],
				localConflicted: [] as number[],
			}

			let slotIndex = 0
			// initial load of the slot file - we need to handle all records as unseen
			for (const addeRecord of freshSlotfile.recordSlots) {
				if (addeRecord) {
					result.created.push(slotIndex)
				}
				slotIndex++
			}
			return result
		}

		const memoryOriginState = statesBefore.memorySlotFileState

		if (memoryOriginState === undefined) {
			throw new Error(
				"memory origin state should exist for files we read from the disc (creation conflict??)"
			)
		}

		const mergeResult = mergeRecordsWithoutLocalConflicts(
			memoryOriginState,
			freshSlotfile,
			statesBefore.changedRecords
		)

		debug(
			"loadSlotFileFromWorkingCopy - mergeUnconflictingRecords done,  updating slot state to " +
				statesBefore.stateFlag ===
				"loadrequested"
				? "loadrequested"
				: "loaded"
		)

		const result = {
			upsertedSlotFileStates: {
				slotFileName: statesBefore.slotFileName,
				changedRecords: statesBefore.changedRecords,
				memorySlotFileState: mergeResult.mergedState,
				fsSlotFileState: mergeResult.conflictingSlotIndexes.length > 0 ? freshSlotfile : undefined,
				headSlotfileState: statesBefore.headSlotfileState,
				// check that no other load request hit in in the meantime
				stateFlag:
					statesBefore.stateFlag === "loadrequested"
						? ("loadrequested" as const)
						: ("loaded" as const),
			} as SlotFileStates<DocType>,
			created: mergeResult.createdSlotIndexes,
			updated: mergeResult.updatedSlotIndexes,
			localConflicted: mergeResult.conflictingSlotIndexes,
		}

		return result
	}

	/**
	 * Loads all scheduled slotfiles from disc
	 *
	 * @param {Object} options - The options object.
	 * @param {DocType} options.forceReload - set to true if you want to reload all slotfiles even if not scheduled for reload (usually scheduled on change by watcher)
	 */
	const loadSlotFilesFromFs = async ({ forceReload }: { forceReload?: boolean }) => {
		const loadResults = {
			created: [] as string[],
			updated: [] as string[],
			conflicting: [] as string[],
		}

		const slotfileNamesToLoad = await fs.readdir(path)
		const loadPromises: ReturnType<typeof loadSlotFileFromFs>[] = []
		for (const slotFilePath of slotfileNamesToLoad) {
			if (slotFilePath.endsWith(".slot")) {
				const slotFileName = slotFilePath.slice(
					0,
					Math.max(0, slotFilePath.length - ".slot".length)
				)
				if (forceReload) {
					const knownSlotFile = fileNamesToSlotfileStates.get(slotFileName)
					if (knownSlotFile) {
						knownSlotFile.stateFlag = "loadrequested"
					}
				}

				loadPromises.push(loadSlotFileFromFs(slotFileName))
			}
		}

		const fslLoadResults = await Promise.all(loadPromises)

		for (const loadResult of fslLoadResults) {
			if (loadResult) {
				const freshState = loadResult.upsertedSlotFileStates
				fileNamesToSlotfileStates.set(freshState.slotFileName, freshState)

				for (const createdIndex of loadResult.created) {
					const createdRecord = freshState.memorySlotFileState.recordSlots[createdIndex]
					if (createdRecord?.data[idProperty]) {
						idToSlotFileName.set(createdRecord.data[idProperty], freshState.slotFileName)
						updateSlotEntryStates(createdRecord.data[idProperty], createdRecord.index)
						loadResults.created.push(createdRecord?.data[idProperty])
					}
				}

				for (const updatedIndex of loadResult.updated) {
					const updatedRecord = freshState.memorySlotFileState.recordSlots[updatedIndex]
					if (updatedRecord?.data[idProperty]) {
						idToSlotFileName.set(updatedRecord.data[idProperty], freshState.slotFileName)
						updateSlotEntryStates(updatedRecord.data[idProperty], updatedRecord.index)
						loadResults.updated.push(updatedRecord?.data[idProperty])
					}
				}

				for (const localConflictingIndex of loadResult.localConflicted) {
					const conflictingRecord =
						freshState.memorySlotFileState.recordSlots[localConflictingIndex]
					if (conflictingRecord?.data[idProperty]) {
						idToSlotFileName.set(conflictingRecord.data[idProperty], freshState.slotFileName)
						updateSlotEntryStates(conflictingRecord.data[idProperty], conflictingRecord.index)
						loadResults.conflicting.push(conflictingRecord?.data[idProperty])
					}
				}
			}
		}

		if (
			loadResults.created.length > 0 ||
			loadResults.updated.length > 0 ||
			loadResults.conflicting.length > 0
		) {
			changeCallback("fs", "record-change")
		}

		const ids = new Set([
			...loadResults.created,
			...loadResults.updated,
			...loadResults.conflicting,
		])

		if (ids.size > 0) {
			changeCallback("fs", "records-change", [...ids.values()])
		}
		_internal.lastLoad = loadResults

		return loadResults
	}

	const loadSlotFileFromHead = async (
		currentState: SlotFileStates<DocType>,
		headBlobOid: string,
		readBlob: Awaited<ReturnType<typeof openRepository>>["readBlob"]
	) => {
		// TODO load the head state of the slot file
		const blobResult = await readBlob({ oid: headBlobOid })

		const decoder = new TextDecoder("utf-8")
		const jsonString = decoder.decode(blobResult.blob)
		const headRecordSlots = await parseSlotFile<DocType>(jsonString)

		const headSlotFileState: SlotFile<DocType> = {
			contentHash: headBlobOid,
			exists: true,
			recordSlots: headRecordSlots,
		}

		const uncommitedSlotIndexes: number[] = []
		const unawareHeadSlotIndexes: number[] = []
		const indexToId: string[] = []

		const maxSlotsPerFile = Math.max(
			currentState.memorySlotFileState.recordSlots.length,
			Math.max(headRecordSlots.length, currentState.changedRecords.length)
		)

		for (let currentSlotIndex = 0; currentSlotIndex <= maxSlotsPerFile; currentSlotIndex += 1) {
			const loadedSlotEntry = currentState.memorySlotFileState.recordSlots[currentSlotIndex]
			const headSlotEntry = headRecordSlots[currentSlotIndex]
			const changedRecord = currentState.changedRecords[currentSlotIndex]

			if (!loadedSlotEntry && !changedRecord && !headSlotEntry) {
				// no record in slot - NoOp
				// debug("mergeRecordsWithoutLocalConflicts - no record in slot")
			} else if (
				loadedSlotEntry &&
				headSlotEntry &&
				loadedSlotEntry.slotEntryHash === headSlotEntry.slotEntryHash
			) {
				// nothing new from the loaded file for this record
				// - no op
			} else if (
				loadedSlotEntry &&
				headSlotEntry &&
				loadedSlotEntry.slotEntryHash !== headSlotEntry.slotEntryHash
			) {
				uncommitedSlotIndexes.push(currentSlotIndex)
				indexToId[currentSlotIndex] = loadedSlotEntry.data[idProperty]
			} else if (!loadedSlotEntry && headSlotEntry) {
				unawareHeadSlotIndexes.push(currentSlotIndex)
			} else if (loadedSlotEntry && !headSlotEntry) {
				indexToId[currentSlotIndex] = loadedSlotEntry.data[idProperty]
				uncommitedSlotIndexes.push(currentSlotIndex)
			}
		}

		return {
			currentState,
			headSlotFileState,
			uncommitedSlotIndexes,
			unawareHeadSlotIndexes,
			indexToId,
		}
	}

	/**
	 * should be triggered whenever the status list is changed (when the head commit changed)
	 */
	const updateSlotFileHeadStates = async (
		statusList: Awaited<ReturnType<Awaited<ReturnType<typeof openRepository>>["statusList"]>>,
		readBlob: Awaited<ReturnType<typeof openRepository>>["readBlob"]
	) => {
		// TODO lockfile
		const loadHeadPromises: ReturnType<typeof loadSlotFileFromHead>[] = []

		// first collect all updates from head
		for (const statusEntry of statusList) {
			// TODO go through all slot files and check the head oid - if it differs - update slotfile
			const statusEntryDetails = (statusEntry as any)[2] as { headOid: string | undefined }
			const statusEntryFileName = statusEntry[0]
			const currentState = fileNamesToSlotfileStates.get(statusEntryFileName)
			if (!currentState) {
				continue
			}

			if (
				currentState.memorySlotFileState.contentHash !== statusEntryDetails.headOid &&
				statusEntryDetails.headOid &&
				currentState.headSlotfileState?.contentHash !== statusEntryDetails.headOid
			) {
				loadHeadPromises.push(
					loadSlotFileFromHead(currentState, statusEntryDetails.headOid, readBlob)
				)
			}
		}

		const headLoadResults = await Promise.all(loadHeadPromises)

		const changedIds: string[] = []

		for (const statusEntry of statusList) {
			// TODO go through all slot files and check the head oid - if it differs - update slotfile
			const statusEntryDetails = (statusEntry as any)[2] as { headOid: string | undefined }
			const statusEntryFileName = statusEntry[0]
			const currentState = fileNamesToSlotfileStates.get(statusEntryFileName)
			if (!currentState) {
				continue
			}

			if (
				currentState.memorySlotFileState.contentHash === statusEntryDetails.headOid &&
				currentState.headSlotfileState
			) {
				currentState.headSlotfileState = undefined
				// TODO trigger change event
				for (const record of currentState.memorySlotFileState.recordSlots) {
					if (record?.headState) {
						changedIds.push(record.data[idProperty])
						updateSlotEntryStates(record.data[idProperty], record.index)
					}
				}
			}
		}

		for (const headLoadedResult of headLoadResults) {
			headLoadedResult.currentState.headSlotfileState = headLoadedResult.headSlotFileState
			for (const uncommitedSlotIndex of headLoadedResult.uncommitedSlotIndexes) {
				const id = headLoadedResult.indexToId[uncommitedSlotIndex]!
				updateSlotEntryStates(id, uncommitedSlotIndex)
				changedIds.push(id)
			}

			// TODO how shall we handle headLoadedResult.unawareHeadSlotIndexes
		}

		if (changedIds.length > 0) {
			changeCallback("fs", "records-change", changedIds)
		}
	}

	const onSlotFileChange = (slotFileName: string) => {
		const knownSlotFile = fileNamesToSlotfileStates.get(slotFileName)

		if (knownSlotFile) {
			knownSlotFile.stateFlag = "loadrequested"
		}

		debug("setting " + slotFileName + " to load requested and trigger load")

		loadSlotFilesFromFs({})
	}

	const getSlotFileByRecordId = (id: string) => {
		const recordsSlotfileName = idToSlotFileName.get(id)
		if (recordsSlotfileName) {
			return fileNamesToSlotfileStates.get(recordsSlotfileName)
		}
		return undefined
	}

	const updateSlotEntryStates = (slotEntryId: string, slotEntryIndex: number) => {
		const recordSlotfile = getSlotFileByRecordId(slotEntryId)

		const slotIndex = slotEntryIndex

		if (!recordSlotfile) {
			throw new Error("Slotfile not found")
		}

		// TODO look up on coflicting entries as werll?
		const changedRecord = recordSlotfile.changedRecords[slotIndex]

		const recordConflictingWithCurrentWorkingFile =
			recordSlotfile.fsSlotFileState?.recordSlots[slotIndex]

		const recordOriginState = recordSlotfile.memorySlotFileState?.recordSlots[slotIndex]

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- one of them must exist otherwise the record does not exist
		const currentState = changedRecord ? changedRecord : recordOriginState!

		const localConflict = recordConflictingWithCurrentWorkingFile
			? deepFreeze({
					data: recordConflictingWithCurrentWorkingFile.data,
					hash: recordConflictingWithCurrentWorkingFile.hash,
			  })
			: undefined

		let mergeConflict = recordConflictingWithCurrentWorkingFile?.mergeConflict

		if (recordOriginState && recordOriginState.mergeConflict) {
			mergeConflict = deepFreeze(recordOriginState.mergeConflict)
		}

		const headSlotEntry = recordSlotfile.headSlotfileState?.recordSlots[slotIndex]
		let headState = headSlotEntry
			? deepFreeze({
					data: headSlotEntry.data,
					hash: headSlotEntry.hash,
			  })
			: undefined
		let gitState: "uncommited" | "commited" = "uncommited"
		if (headState) {
			if (currentState.hash === recordSlotfile.headSlotfileState?.recordSlots[slotIndex]?.hash) {
				// if the hash is the same we don't pass the head state but flag it as commited
				headState = undefined
				gitState = "commited"
			} else {
				gitState = "uncommited"
			}
		}

		const currentRecordState: SlotEntry<DocType> = {
			slotEntryHash: currentState.hash,
			hash: deepFreeze(currentState.hash),
			data: deepFreeze(currentState.data),
			headState,
			gitState,
			localConflict: localConflict,
			mergeConflict,
			index: currentState.index,
		}

		slotEntryStates.set(slotEntryId, currentRecordState)
	}

	/**
	 * checks transient slotentries as well as persisted, collects all known conflicts:
	 * - local conflicts - changes done in memory based on a state that is no longer reflected by the disc
	 * - merge conflicts - conflicts present in the current slot file state
	 *
	 * and returns the slot entry
	 *
	 * @param id the id of the slot entry to fetch
	 * @returns
	 */
	const getSlotEntryById = (id: string) => {
		return slotEntryStates.get(id)
	}

	let abortController: AbortController | undefined

	const stopWatchingSlotfileChanges = () => {
		abortController?.abort()
	}

	const findDocumentsById = (docIds: string[] /*, withDeleted: boolean*/): SlotEntry<DocType>[] => {
		const matchingDocuments: SlotEntry<DocType>[] = []

		for (const docId of docIds) {
			const slotEntry = getSlotEntryById(docId)
			// TODO move deletion to application level?
			// if (slotEntry && (!slotEntry._deleted || withDeleted)) {
			if (slotEntry) {
				matchingDocuments.push(slotEntry)
			}
		}
		return matchingDocuments
	}

	const _internal = {
		fileNamesToSlotfileStates,
		fs,
		lastLoad: {},
		loadSlotFilesFromFs,
		idToSlotFileName,
		changeCallback,
		getSlotEntryById,
		slotEntryStates,
		updateSlotEntryStates,
		updateSlotFileHeadStates,
	}

	// start

	if (watch) {
		const startWatchingSlotfileChanges = () => {
			const abortController = new AbortController()

			// NOTE: watch will not throw an exception since we don't await it here.
			const watcher = fs.watch(path, {
				signal: abortController.signal,
				persistent: false,
			})

			;(async () => {
				try {
					//eslint-disable-next-line @typescript-eslint/no-unused-vars
					for await (const event of watcher) {
						if (event.filename && event.filename.endsWith(".slot")) {
							onSlotFileChange(
								event.filename.slice(0, Math.max(0, event.filename.length - ".slot".length))
							)
						}
					}
				} catch (err: any) {
					if (err.name === "AbortError") return
					// https://github.com/opral/monorepo/issues/1647
					// the file does not exist (yet)
					// this is not testable beacause the fs.watch api differs
					// from node and lix. lenghty
					else if (err.code === "ENOENT") return
					throw err
				}
			})()
		}
		startWatchingSlotfileChanges()
	}

	await loadSlotFilesFromFs({ forceReload: true })

	return {
		/**
		 * internal properties used for debug purpose (checking internal states during tests)
		 */
		_internal,
		dispose: () => {
			stopWatchingSlotfileChanges()
		},
		loadSlotFilesFromWorkingCopy: loadSlotFilesFromFs,
		findDocumentsById,
		readAll: async (/*includeDeleted: boolean = false*/) => {
			const objectIds: string[] = [...idToSlotFileName.keys()]
			// const allObjectsById = new Map<string, SlotEntry<DocType>>()
			const matchingSlotEntries: SlotEntry<DocType>[] = []

			for (const docId of objectIds) {
				const slotEntry = getSlotEntryById(docId)
				// TODO move deletion to application level?
				// if (slotEntry && (!slotEntry._deleted || withDeleted)) {
				if (slotEntry) {
					matchingSlotEntries.push(slotEntry)
				}
			}
			return matchingSlotEntries
		},
		resolveMergeConflict() {},
		setCallback(callback: (source: "api" | "fs", eventName: string, records?: string[]) => void) {
			changeCallback = callback
			_internal.changeCallback = callback
		},
	}
}

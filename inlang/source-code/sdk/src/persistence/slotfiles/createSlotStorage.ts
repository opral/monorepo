import type { NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
import { SlotEntry } from "./types/SlotEntry.js"
import { hash } from "./utill/hash.js"
import { stringifySlotFile } from "./utill/stringifySlotFile.js"
import { parseSlotFile } from "./utill/parseSlotFile.js"
import { SlotFileStates } from "./types/SlotFileStates.js"
import { SlotFile } from "./types/SlotFile.js"
import { HasId } from "./types/HasId.js"
const debug = _debug("sdk:slotfile")

/**
 *
 * @param fs nodeFs to use for persistence // TODO replace with lix for conflict resolution
 * @param path base path to store each collection in
 * @returns
 */
export default function createSlotStorage<DocType extends HasId>(
	fs: NodeishFilesystem,
	path: string,
	changeCallback: (eventName: string) => void
) {
	// property to use to test for identity of an object within a collection
	// NOTE: use schema primary key like in https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106
	const idProperty = "id"

	// We use the characters from the content sha encoded in hex so any 16^x value possible
	const slotSize = 16
	const fileNameCharacters = 1

	const idToSlotFileName = new Map<string, string>()

	// appended or update in sert
	const fileNamesToSlotfileStates = new Map<string, SlotFileStates<DocType>>()

	// records that have been inserted but not picked up for persistence yet
	const transientSlotEntries = new Map<string, SlotEntry<DocType>>()

	let connected = false

	const normalizeObject = (objectToNormalize: any) => {
		return objectToNormalize // TODO normalize json
	}

	/**
	 *
	 * Merges the updated Slotfile into the current Slotfile but keeps conflicting records (has local changes and updated in updatedSlotfileState) untouched
	 *
	 * @param currentSlotfileState
	 * @param updatedSlotfileState
	 * @param localChanges
	 */
	const mergeUnconflictingRecords = (
		currentSlotfileState: SlotFile<DocType>,
		updatedSlotfileState: SlotFile<DocType>,
		localChanges: (SlotEntry<DocType> | null)[]
	) => {
		const mergedState = structuredClone(currentSlotfileState)
		const conflictingSlotIndexes: number[] = []
		const updatedSlotIndexes: number[] = []

		// content of a slotfile has changed we need to check each record
		for (const [currentSlotIndex, loadedSlotEntry] of currentSlotfileState.recordSlots.entries()) {
			const freshSlotEntry = updatedSlotfileState.recordSlots[currentSlotIndex]

			const changedRecord = localChanges[currentSlotIndex]

			if (!loadedSlotEntry && !changedRecord && !freshSlotEntry) {
				// no record in slot - NoOp
			} else if (
				loadedSlotEntry &&
				freshSlotEntry &&
				loadedSlotEntry.hash === freshSlotEntry.hash
			) {
				// nothing new from the loaded file for this record
				// - no op
			} else if (
				loadedSlotEntry &&
				freshSlotEntry &&
				loadedSlotEntry.hash !== freshSlotEntry.hash
			) {
				if (!changedRecord) {
					// nothin changed in memory - no conflict - use fresh loaded state...
					mergedState.recordSlots[currentSlotIndex] = freshSlotEntry
				} else if (changedRecord) {
					// the record has changed in memory - and the data loaded from working copy has changed - keep memory origin and the memory untouched
					conflictingSlotIndexes.push(currentSlotIndex)
				}
			} else if (!loadedSlotEntry && freshSlotEntry) {
				if (!changedRecord) {
					// record found in update slotfile that didn't exist in memory yet
					mergedState.recordSlots[currentSlotIndex] = freshSlotEntry
					updatedSlotIndexes.push(currentSlotIndex)
				} else {
					throw new Error("record created in slot file conflicts with loaded record in slot")
				}
			} else if (loadedSlotEntry && !freshSlotEntry) {
				// NOTE: working file seem to have change to an older version that didn't know about the entry in the slot?
				throw new Error("record does not exit in slot file anymore")
			}
		}

		mergedState.contentHash = updatedSlotfileState.contentHash

		return {
			mergedState,
			conflictingSlotIndexes,
			updatedSlotIndexes,
		}
	}

	const loadSlotFileFromWorkingCopy = async (slotFileName: string) => {
		// NOTE: assert the right format of the slot file name - can be removed when everything is good - and this is a performance issue
		const [hashPart, bucketPart] = slotFileName.split("_")
		if (!hashPart && !bucketPart) {
			throw new Error("Slotfile expects to have to parts, the hash and the bucket")
		}

		const result = {
			created: [] as string[],
			updated: [] as string[],
			conflicting: [] as string[],
		}

		debug("loadSlotFileFromWorkingCopy " + slotFileName)
		// NOTE: we can use lix to check if the current file is conflicting and load the conflicting state
		const slotfileStatesBeforeLoad = fileNamesToSlotfileStates.get(slotFileName)

		if (slotfileStatesBeforeLoad) {
			if (slotfileStatesBeforeLoad.workingCopyStateFlag === "loadrequested") {
				slotfileStatesBeforeLoad.workingCopyStateFlag = "loading"
				debug("loadSlotFileFromWorkingCopy " + slotFileName + " state -> loading")
			} else {
				debug(
					"loadSlotFileFromWorkingCopy " +
						slotFileName +
						" skipped state was " +
						slotfileStatesBeforeLoad.workingCopyStateFlag +
						" not loadrequested"
				)
				return result
			}
		}

		const slotFileContent = await fs.readFile(path + slotFileName + ".slot", { encoding: "utf-8" })
		const slotFileContentHash = hash(slotFileContent)

		if (
			slotfileStatesBeforeLoad &&
			slotfileStatesBeforeLoad.memoryOriginState?.contentHash === slotFileContentHash
		) {
			debug("loadSlotFileFromWorkingCopy " + slotFileName + " hash was equal state -> loaded")
			slotfileStatesBeforeLoad.workingCopyStateFlag = "loaded"
			// content is equal - no further loading needed
			return result
		}

		const slotFileContentParsed = parseSlotFile(slotFileContent)

		const freshSlotfile: SlotFile<DocType> = Object.freeze({
			contentHash: slotFileContentHash,
			exists: true,
			recordSlots: slotFileContentParsed,
		})

		if (slotfileStatesBeforeLoad === undefined) {
			// Load new, yet unknown slot file to memory
			const addedSlotFileStates: SlotFileStates<DocType> = {
				slotFileName: slotFileName,
				conflictingWorkingFile: undefined,
				workingCopyStateFlag: "loaded",
				memoryOriginState: freshSlotfile,
				changedRecords: [],
			}

			// initial load of the slot file - we need to handle all records as unseen
			for (const addeRecord of freshSlotfile.recordSlots) {
				if (addeRecord) {
					idToSlotFileName.set(addeRecord.data.id, slotFileName)
					result.created.push(addeRecord.data.id)
				}
			}

			fileNamesToSlotfileStates.set(slotFileName, addedSlotFileStates)
			changeCallback("slots-changed")
		} else {
			const memoryOriginState = slotfileStatesBeforeLoad.memoryOriginState

			if (memoryOriginState === undefined) {
				throw new Error(
					"memory origin state should exist for files we read from the disc (creation conflict??)"
				)
			}

			const mergeResult = mergeUnconflictingRecords(
				memoryOriginState,
				freshSlotfile,
				slotfileStatesBeforeLoad.changedRecords
			)

			debug(
				"loadSlotFileFromWorkingCopy - mergeUnconflictingRecords done,  updating slot state to " +
					slotfileStatesBeforeLoad.workingCopyStateFlag ===
					"loadrequested"
					? "loadrequested"
					: "loaded"
			)

			const updatedSlotfileStates: SlotFileStates<DocType> = {
				slotFileName: slotfileStatesBeforeLoad.slotFileName,
				changedRecords: slotfileStatesBeforeLoad.changedRecords,
				memoryOriginState: mergeResult.mergedState,
				conflictingWorkingFile:
					mergeResult.conflictingSlotIndexes.length > 0 ? freshSlotfile : undefined,

				// check that no other load request hit in in the meantime
				workingCopyStateFlag:
					slotfileStatesBeforeLoad.workingCopyStateFlag === "loadrequested"
						? "loadrequested"
						: "loaded",
			}

			fileNamesToSlotfileStates.set(updatedSlotfileStates.slotFileName, updatedSlotfileStates)

			for (const updatedSlotIndex of mergeResult.updatedSlotIndexes) {
				const updatedRecordId =
					mergeResult.mergedState.recordSlots[updatedSlotIndex]?.data[idProperty]
				if (updatedRecordId) {
					idToSlotFileName.set(updatedRecordId, slotfileStatesBeforeLoad.slotFileName)
					result.updated.push(updatedRecordId)
				}
			}

			for (const conflictedSlotIndex of mergeResult.conflictingSlotIndexes) {
				const conflictedRecordId =
					mergeResult.mergedState.recordSlots[conflictedSlotIndex]?.data[idProperty]
				if (conflictedRecordId) {
					result.conflicting.push(conflictedRecordId)
				}
			}
			changeCallback("slots-changed")
		}

		return result
	}

	const loadSlotFilesFromWorkingCopy = async () => {
		const slotfileNamesToLoad = await fs.readdir(path)
		for (const slotFilePath of slotfileNamesToLoad) {
			if (slotFilePath.endsWith(".slot")) {
				const result = await loadSlotFileFromWorkingCopy(
					slotFilePath.slice(0, Math.max(0, slotFilePath.length - ".slot".length))
				)
				if (result.created.length > 0 || result.updated.length > 0) {
					changeCallback("record-change")
				}
			}
		}
	}

	const reloadDirtySlotFiles = async () => {
		return await loadSlotFilesFromWorkingCopy()
	}

	const saveChangesToWorkingCopy = async () => {
		// TODO get lock - so we don't expect further dirty flags comming up
		debug("saveChangesToWorkingCopy - reloadDirtySlotFiles")
		await reloadDirtySlotFiles()

		// find or create free buckets for transient entries
		const transientSlotFiles = new Map<string, SlotFile<DocType>>()
		const reserverdSlotsByFile = new Map<string, SlotEntry<DocType>[]>()

		debug("saveChangesToWorkingCopy - find or create free buckets for transient entries")
		for (const transientSlotEntry of transientSlotEntries.values()) {
			const baseFileName = hash(transientSlotEntry.data.id).slice(0, fileNameCharacters)
			let currentBucketIndex = 0

			// try bucket by bucket and create a new one if needed
			let transientSlotEntryParked = false
			while (!transientSlotEntryParked) {
				const slotFileNameToCheck = baseFileName + "_" + currentBucketIndex
				// the slotfile can exist in two places (as persisted once or within the not yet saved phantom slotfiles)
				const slotFileToCheck = fileNamesToSlotfileStates.get(slotFileNameToCheck)
				const transientSlotFileToCheck = transientSlotFiles.get(slotFileNameToCheck)
				const slotsUsedByPhantomsInSlotFile = reserverdSlotsByFile.get(slotFileNameToCheck) ?? []

				if (!slotFileToCheck && !transientSlotFileToCheck) {
					// we don't have a bucket file that can store the record - create a new one
					const newTransientSlotFile: SlotFile<DocType> = {
						exists: false,
						recordSlots: [],
						contentHash: undefined,
					}
					debug(
						"saveChangesToWorkingCopy - no free slot found - createing a new transient slot file"
					)
					transientSlotEntryParked = true
					newTransientSlotFile.recordSlots[transientSlotEntry.index] = transientSlotEntry
					transientSlotFiles.set(slotFileNameToCheck, newTransientSlotFile)
				} else if (
					slotFileToCheck && // does the file exist already and has a free slot?
					!slotFileToCheck.memoryOriginState.recordSlots[transientSlotEntry.index] &&
					!slotFileToCheck.conflictingWorkingFile?.recordSlots[transientSlotEntry.index]
				) {
					// we found a free slot in the current bucket of the persisted file - was it used by a phantom already?
					if (!slotsUsedByPhantomsInSlotFile[transientSlotEntry.index]) {
						debug(
							"saveChangesToWorkingCopy - free slot in exisitng slotfile (" +
								slotFileNameToCheck +
								") found"
						)
						transientSlotEntryParked = true
						slotsUsedByPhantomsInSlotFile[transientSlotEntry.index] = transientSlotEntry
						reserverdSlotsByFile.set(slotFileNameToCheck, slotsUsedByPhantomsInSlotFile)
					}
				} else if (
					transientSlotFileToCheck && // was a transient SlotFile with the given name created that has a free slot?
					!transientSlotFileToCheck?.recordSlots[transientSlotEntry.index]
				) {
					debug(
						"saveChangesToWorkingCopy - using an exisitng transient slotfile (" +
							slotFileNameToCheck +
							") found"
					)
					transientSlotEntryParked = true
					transientSlotFileToCheck.recordSlots[transientSlotEntry.index] = transientSlotEntry
				}

				if (!transientSlotEntryParked) {
					debug(
						"saveChangesToWorkingCopy -  no free slot in current bucket " +
							currentBucketIndex +
							" found "
					)
				}
				currentBucketIndex += 1
			}
		}

		// process changed and new slotentries for existing slot files
		debug("saveChangesToWorkingCopy - process changed and new slotentries for existing slot files")
		for (const knownSlotFileStates of fileNamesToSlotfileStates.values()) {
			debug(
				"saveChangesToWorkingCopy - start proccessing " +
					path +
					knownSlotFileStates.slotFileName +
					".slot"
			)

			// assert that the current slot file is in loaded state - no event has marked it as dirty - this should not happen since we locked the file...
			if (knownSlotFileStates.workingCopyStateFlag !== "loaded") {
				throw new Error(
					"a new dirty flag during save detected? " +
						knownSlotFileStates.slotFileName +
						" " +
						knownSlotFileStates.workingCopyStateFlag
				)
			}

			const reservedSlots = reserverdSlotsByFile.get(knownSlotFileStates.slotFileName)

			if (
				knownSlotFileStates.changedRecords.length === 0 &&
				(!reservedSlots || reservedSlots.length === 0)
			) {
				debug(
					"saveChangesToWorkingCopy - no changes detected for " +
						path +
						knownSlotFileStates.slotFileName +
						".slot"
				)
				// no change in memory for the given file (no records changed, no new slots reserved by transient records)
				continue
			}

			const conflictingSlotFile = knownSlotFileStates.conflictingWorkingFile
			const memorySlotFile = structuredClone(knownSlotFileStates.memoryOriginState)

			// we update all objects one by one and update the workingCopyState and the memoryOriginState
			let workingCopyStateToWrite: SlotFile<DocType> | undefined
			const newMemoryOriginStateToWrite = memorySlotFile

			for (let currentSlotIndex = 0; currentSlotIndex < slotSize; currentSlotIndex += 1) {
				const changedSlotEntry = knownSlotFileStates.changedRecords[currentSlotIndex]
				const newSlotEntry = reservedSlots?.[currentSlotIndex]

				if (!changedSlotEntry && !newSlotEntry) {
					continue
				}

				if (changedSlotEntry && newSlotEntry) {
					throw new Error("invalid state: changed and new slot entry detected!")
				}

				if (newSlotEntry) {
					debug("saveChangesToWorkingCopy -  processing new slot entry")
				}

				if (changedSlotEntry) {
					debug("saveChangesToWorkingCopy -  processing updated slot entry")
				}

				const upsertedSlotEntry = changedSlotEntry ?? newSlotEntry!

				if (
					!conflictingSlotFile ||
					conflictingSlotFile.recordSlots[currentSlotIndex]?.hash ===
						memorySlotFile.recordSlots[currentSlotIndex]?.hash
				) {
					if (workingCopyStateToWrite === undefined) {
						// if we have a conflicting slotfile we work in with the changes that don't conflict
						workingCopyStateToWrite = structuredClone(conflictingSlotFile ?? memorySlotFile)
					}

					workingCopyStateToWrite.recordSlots[currentSlotIndex] = upsertedSlotEntry

					newMemoryOriginStateToWrite.contentHash = undefined
					newMemoryOriginStateToWrite.recordSlots[currentSlotIndex] = upsertedSlotEntry

					upsertedSlotEntry._writingFlag = true
				}
			}

			if (workingCopyStateToWrite) {
				const workingCopySlotfileContent = stringifySlotFile<DocType>(
					workingCopyStateToWrite,
					slotSize
				)
				const workingCopySlotfileContentHash = hash(workingCopySlotfileContent)

				// apply every non conflicting in memory state to the working copy
				debug("writing file" + path + knownSlotFileStates.slotFileName)
				await fs.writeFile(
					path + knownSlotFileStates.slotFileName + ".slot",
					workingCopySlotfileContent
				)

				// cleanup change records and phantoms
				let noOutstandingChange = true
				for (const [
					changedSlotIndex,
					changedSlotEntry,
				] of knownSlotFileStates.changedRecords.entries()) {
					if (changedSlotEntry) {
						if (changedSlotEntry._writingFlag) {
							delete knownSlotFileStates.changedRecords[changedSlotIndex]
						} else {
							noOutstandingChange = false
						}
					}
				}
				if (noOutstandingChange) {
					// NOTE: deletion of the elements will keep empty slots - we wan't to check for length === 0 so we have to apply a new array here if all slots are empty
					knownSlotFileStates.changedRecords = []
				}

				for (const [id, transientSlotEntry] of transientSlotEntries.entries()) {
					if (transientSlotEntry._writingFlag) {
						idToSlotFileName.set(id, knownSlotFileStates.slotFileName)
						transientSlotEntries.delete(id)
					}
				}

				workingCopyStateToWrite.contentHash = workingCopySlotfileContentHash

				const memoryOriginSlotfileContent = stringifySlotFile<DocType>(
					newMemoryOriginStateToWrite,
					slotSize
				)
				newMemoryOriginStateToWrite.contentHash = hash(memoryOriginSlotfileContent)

				knownSlotFileStates.conflictingWorkingFile = workingCopyStateToWrite
				knownSlotFileStates.memoryOriginState = newMemoryOriginStateToWrite
				knownSlotFileStates.workingCopyStateFlag = "loadrequested"
			}
		}

		// write transient slotfiles containing slotentries
		debug("saveChangesToWorkingCopy - write transient slotfiles containing slotentries")
		for (const [fileName, transientSlotFile] of transientSlotFiles.entries()) {
			for (const slot of transientSlotFile.recordSlots) {
				if (slot) {
					slot._writingFlag = true
				}
			}

			const memoryStateSlotfileContent = stringifySlotFile<DocType>(transientSlotFile, slotSize)

			// apply every non conflicting in memory state to the working copy
			await fs.writeFile(path + fileName + ".slot", memoryStateSlotfileContent)

			for (const transientSlotEntry of transientSlotFile.recordSlots) {
				if (transientSlotEntry?._writingFlag) {
					idToSlotFileName.set(transientSlotEntry.data.id, fileName)
					transientSlotEntries.delete(transientSlotEntry.data.id)
				}
			}

			fileNamesToSlotfileStates.set(fileName, {
				slotFileName: fileName,
				workingCopyStateFlag: "loadrequested",
				conflictingWorkingFile: undefined,
				memoryOriginState: transientSlotFile,
				changedRecords: [],
			})
			changeCallback("slots-changed")
		}
	}

	function onSlotFileChange(
		slotFileName: string /**  source: 'workDir', remote, head, conflict ... */
	) {
		const knownSlotFile = fileNamesToSlotfileStates.get(slotFileName)

		if (knownSlotFile) {
			knownSlotFile.workingCopyStateFlag = "loadrequested"
		}

		debug("setting " + slotFileName + " to load requested and trigger load")

		loadSlotFilesFromWorkingCopy()
	}

	const getSlotFileByRecordId = (id: string) => {
		const recordsSlotfileName = idToSlotFileName.get(id)
		if (recordsSlotfileName) {
			return fileNamesToSlotfileStates.get(recordsSlotfileName)
		}
		return undefined
	}

	const getSlotEntryById = (id: string) => {
		debug("getSlotEntryById")
		const phantomSlotEntry = transientSlotEntries.get(id)
		if (phantomSlotEntry) return phantomSlotEntry

		debug("getSlotEntryById - no phantomSlotEntry")

		const recordSlotfile = getSlotFileByRecordId(id)

		debug(recordSlotfile)
		if (recordSlotfile) {
			debug("getSlotEntryById - recordSlotfile exists")
			const updatedRecord = recordSlotfile.changedRecords.find(
				(changedRecord) => changedRecord?.data.id === id
			)
			if (updatedRecord) return updatedRecord
			debug("getSlotEntryById - recordSlotfile exists - no changes")
			debug(recordSlotfile.memoryOriginState?.recordSlots)
			debug(id)
			return recordSlotfile.memoryOriginState?.recordSlots.find(
				(loadedRecord) => loadedRecord?.data.id === id
			)
		}
		return
	}

	const makeWatcher = (path: string) => {
		;(async () => {
			try {
				// TODO setup abort controller
				// const ac = new AbortController()
				// abortControllers.push(ac)
				const watcher = fs.watch(path, {
					// signal: ac.signal,
					persistent: false,
				})
				if (watcher) {
					//eslint-disable-next-line @typescript-eslint/no-unused-vars
					for await (const event of watcher) {
						if (event.filename && event.filename.endsWith(".slot")) {
							onSlotFileChange(
								event.filename.slice(0, Math.max(0, event.filename.length - ".slot".length))
							)
						}
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
	makeWatcher(path)

	return {
		_fileNamesToSlotfileStates: fileNamesToSlotfileStates,
		connect: async () => {
			// TODO ensure, we are not connected yet

			// TODO listen on changes in the folder to relaod the objects from disc and set dirtyFlag = true on file change event
			//

			// load all slot files from disc
			await loadSlotFilesFromWorkingCopy()

			// TODO listen to lix conflict states
		},
		disconnect: () => {
			connected = false
			fileNamesToSlotfileStates.clear()
			// TODO stop listening to fs changes
		},
		insert: (document: DocType /*, collectionName: string*/) => {
			// TODO move slot selection to save method - to avoid conflict handling (set file as none)
			// set the file reference in th

			debug("INSERT")

			const documentId = document[idProperty]

			const existingSlotRecord = getSlotEntryById(documentId)
			if (existingSlotRecord) {
				throw new Error("Object with id " + documentId + " exists already - can't insert")
			}

			const normalizedObject = normalizeObject(document)
			const stringiedObject = JSON.stringify(normalizedObject)
			const objectHash = hash(stringiedObject)

			// the last n characters of the hash represent the insert positon
			const slotIndex = parseInt(objectHash.slice(-fileNameCharacters), 16)
			console.log(
				"SLOT INDEX FOR INSERT RECORD:" +
					slotIndex +
					" hash " +
					objectHash +
					" characters " +
					fileNameCharacters
			)

			const newSlotEntry = {
				// the hash of the object will not stay stable over the livetime of the record - the index does
				index: slotIndex,
				hash: objectHash,
				data: normalizedObject,
				_deleted: false,
			}

			transientSlotEntries.set(documentId, newSlotEntry)
			changeCallback("record-change")
			// TODO trigger save

			// TODO trigger add event
			// TODO return promise that can be awaited - to ensure operation landed on disc
			return saveChangesToWorkingCopy()
		},
		update: async (document: DocType) => {
			// TODO check phantoms
			debug("UPDATE")
			const documentId = document[idProperty]
			const existingSlotEntry = getSlotEntryById(documentId)

			if (!existingSlotEntry) {
				throw new Error("Object with id " + documentId + " does not exist, can't update")
			}

			if (existingSlotEntry._deleted) {
				throw new Error("Slot entry was deleted - update no longer possible")
			}

			const normalizedObject = normalizeObject(document)
			const stringiedObject = JSON.stringify(normalizedObject)
			const objectHash = hash(stringiedObject)
			// update slot files changed records
			const updatedSlotEntry = {
				index: existingSlotEntry.index,
				hash: objectHash,
				data: normalizedObject,
				_deleted: false,
			}

			const recordsSlotfileName = idToSlotFileName.get(documentId)
			const recordSlotfile = recordsSlotfileName
				? fileNamesToSlotfileStates.get(recordsSlotfileName)
				: undefined
			if (recordSlotfile) {
				debug("updating in existing slot file on index" + existingSlotEntry.index)
				recordSlotfile.changedRecords[existingSlotEntry.index] = updatedSlotEntry
			} else {
				debug("adding phantomSlotEntries on index" + updatedSlotEntry.index)
				// update phandom slot entrie
				transientSlotEntries.set(documentId, updatedSlotEntry)
			}

			// TODO return promise that can be awaited - to ensure operation landed on disc
			changeCallback("record-change")
			return saveChangesToWorkingCopy()
		},
		findDocumentsById: (docIds: string[], withDeleted: boolean): Promise<DocType[]> => {
			const matchingDocuments: DocType[] = []

			for (const docId of docIds) {
				const slotEntry = getSlotEntryById(docId)
				if (slotEntry && (!slotEntry._deleted || withDeleted)) {
					matchingDocuments.push(slotEntry.data)
				}
			}
			return Promise.resolve(matchingDocuments)
		},
		readAll: (includeDeleted: boolean = false) => {
			const allObjectsById = new Map<string, SlotEntry<DocType>>()

			// start with phantom record states
			for (const phatomSlotEntry of transientSlotEntries.values()) {
				if (phatomSlotEntry) {
					allObjectsById.set(phatomSlotEntry.data.id, phatomSlotEntry)
				}
			}

			// get all records from the slot files
			for (const slotFile of fileNamesToSlotfileStates.values()) {
				for (const [
					slotIndex,
					slotFileSlotEntry,
				] of slotFile.memoryOriginState.recordSlots.entries()) {
					// favor changes over persisted
					const changedSlot = slotFile.changedRecords[slotIndex]
					if (changedSlot) {
						if (!changedSlot._deleted || includeDeleted) {
							allObjectsById.set(changedSlot.data.id, changedSlot)
						}
					} else {
						if (slotFileSlotEntry && (!slotFileSlotEntry._deleted || includeDeleted)) {
							allObjectsById.set(slotFileSlotEntry.data.id, slotFileSlotEntry)
						}
					}
				}
			}

			// TODO sort?
			// TODO filter deleted && (!phatomSlotEntry._deleted || includeDeleted)
			return [...allObjectsById.values()]
				.filter((slotEntry) => includeDeleted || !slotEntry._deleted)
				.map((slotEntry) => slotEntry.data)
		},
	}
}

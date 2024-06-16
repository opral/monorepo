import type { NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
import type { SlotEntry, TransientSlotEntry } from "./types/SlotEntry.js"
import { hash } from "./utill/hash.js"
import { stringifySlotFile } from "./utill/stringifySlotFile.js"
import { parseSlotFile } from "./utill/parseSlotFile.js"
import type { SlotFileStates } from "./types/SlotFileStates.js"
import type { SlotFile, TransientSlotFile } from "./types/SlotFile.js"
import type { HasId } from "./types/HasId.js"
import { deepFreeze } from "./utill/deepFreeze.js"
const debug = _debug("sdk:slotfile")

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
 * -> OR if the record is a transient record the transient record is replaced with  the updated state
 * 2. a (batched) or explicit call to save() picks up the transient object
 * TODO continue desciption
 *
 * A record can get created in memory
 *  from a higher stage Records can com If you create an object it would be stored in memory as a
 * transient record.
 *
 * @param fs nodeFs to use for persistence // TODO replace with lix for conflict resolution
 * @param path base path to store each collection in
 * @returns
 */
export default function createSlotStorage<DocType extends HasId>(
	slotsPerFile: number,
	fileNameCharacters: number,
	changeCallback: (eventName: string, records?: any[]) => void
) {
	// property to use to test for identity of an object within a collection
	// NOTE: use schema primary key like in https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106
	const idProperty = "id"

	// We use the characters from the content sha encoded in hex so any 16^x value possible
	const slotSize = slotsPerFile
	const slotCharacters = (slotSize - 1).toString(16).length

	const idToSlotFileName = new Map<string, string>()

	// appended or update in sert
	const fileNamesToSlotfileStates = new Map<string, SlotFileStates<DocType>>()

	// records that have been inserted but not picked up for persistence yet
	const transientSlotEntries = new Map<string, TransientSlotEntry<DocType>>()

	// const slotEntryStates = new Map<string, SlotEntry<DocType>>()

	let connectedFs:
		| {
				fs: NodeishFilesystem
				path: string
		  }
		| undefined

	const normalizeObject = (objectToNormalize: any) => {
		return objectToNormalize // TODO normalize json
	}

	/**
	 *
	 * Merges the updated Slotfile into the current Slotfile
	 * - integrates records present in local changes that do not conflict
	 * - keeps conflicting records (has local changes and updated in updatedSlotfileState) untouched
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
		// content of a slotfile has changed we need to check each record
		for (let currentSlotIndex = 0; currentSlotIndex <= slotsPerFile; currentSlotIndex += 1) {
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
				}
			} else if (!loadedSlotEntry && freshSlotEntry) {
				if (!changedRecord) {
					debug(
						"mergeRecordsWithoutLocalConflicts - record found in update slotfile that didnt exist in memory yet... - " +
							currentSlotIndex
					)
					// record found in update slotfile that didn
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

		mergedState.contentHash = freshSlotFileState.contentHash

		return {
			mergedState,
			conflictingSlotIndexes,
			updatedSlotIndexes,
		}
	}

	const loadSlotFileFromWorkingCopy = async (slotFileName: string) => {
		if (!connectedFs) {
			throw new Error("not connected")
		}
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

		const slotFileContent = await connectedFs.fs.readFile(
			connectedFs.path + slotFileName + ".slot",
			{ encoding: "utf-8" }
		)
		const slotFileContentHash = await hash(slotFileContent)

		if (
			slotfileStatesBeforeLoad &&
			(slotfileStatesBeforeLoad.memorySlotFileState?.contentHash === slotFileContentHash ||
				slotfileStatesBeforeLoad.fsSlotFileState?.contentHash === slotFileContentHash)
		) {
			debug("loadSlotFileFromWorkingCopy " + slotFileName + " hash was equal state -> loaded")
			slotfileStatesBeforeLoad.workingCopyStateFlag = "loaded"
			// content is equal - no further loading needed
			return result
		}

		const slotFileContentParsed = parseSlotFile<DocType>(slotFileContent)

		const freshSlotfile: SlotFile<DocType> = Object.freeze({
			contentHash: slotFileContentHash,
			exists: true,
			recordSlots: slotFileContentParsed,
		})

		if (slotfileStatesBeforeLoad === undefined) {
			// Load new, yet unknown slot file to memory
			const addedSlotFileStates: SlotFileStates<DocType> = {
				slotFileName: slotFileName,
				fsSlotFileState: undefined,
				workingCopyStateFlag: "loaded",
				memorySlotFileState: freshSlotfile,
				changedRecords: [],
			}

			// initial load of the slot file - we need to handle all records as unseen
			for (const addeRecord of freshSlotfile.recordSlots) {
				if (addeRecord) {
					// TODO shall we also propagate the id of the conflicting entry?
					idToSlotFileName.set(addeRecord.data.id, slotFileName)
					result.created.push(addeRecord.data.id)
				}
			}

			fileNamesToSlotfileStates.set(slotFileName, addedSlotFileStates)
			changeCallback("slots-changed")
		} else {
			const memoryOriginState = slotfileStatesBeforeLoad.memorySlotFileState

			if (memoryOriginState === undefined) {
				throw new Error(
					"memory origin state should exist for files we read from the disc (creation conflict??)"
				)
			}

			const mergeResult = mergeRecordsWithoutLocalConflicts(
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
				memorySlotFileState: mergeResult.mergedState,
				fsSlotFileState: mergeResult.conflictingSlotIndexes.length > 0 ? freshSlotfile : undefined,

				// check that no other load request hit in in the meantime
				workingCopyStateFlag:
					slotfileStatesBeforeLoad.workingCopyStateFlag === "loadrequested"
						? "loadrequested"
						: "loaded",
			}

			fileNamesToSlotfileStates.set(updatedSlotfileStates.slotFileName, updatedSlotfileStates)

			for (const updatedSlotIndex of mergeResult.updatedSlotIndexes) {
				// TODO what about a possible conflicting entries identifier? -> two inserts on the same slot case
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

	const loadSlotFilesFromWorkingCopy = async (forceReload?: boolean) => {
		if (!connectedFs) {
			throw new Error("not connected")
		}

		const loadResults = {
			created: [] as string[],
			updated: [] as string[],
			conflicting: [] as string[],
		}

		const slotfileNamesToLoad = await connectedFs.fs.readdir(connectedFs.path)
		for (const slotFilePath of slotfileNamesToLoad) {
			if (slotFilePath.endsWith(".slot")) {
				const slotFileName = slotFilePath.slice(
					0,
					Math.max(0, slotFilePath.length - ".slot".length)
				)
				if (forceReload) {
					const knownSlotFile = fileNamesToSlotfileStates.get(slotFileName)
					if (knownSlotFile) {
						knownSlotFile.workingCopyStateFlag = "loadrequested"
					}
				}

				const result = await loadSlotFileFromWorkingCopy(slotFileName)

				loadResults.conflicting = loadResults.conflicting.concat(result.conflicting)
				loadResults.updated = loadResults.updated.concat(result.updated)
				loadResults.created = loadResults.created.concat(result.created)

				if (result.created.length > 0 || result.updated.length > 0 || result.updated.length > 0) {
					changeCallback("record-change")
				}
			}
		}

		const ids = new Set([...loadResults.created, ...loadResults.updated, ...loadResults.updated])

		if (ids.size > 0) {
			changeCallback("records-change", await findDocumentsById([...ids.values()]))
		}

		return loadResults
	}

	/**
	 * This function sorts an array of filenames, performs a binary search to find
	 * the appropriate insertion point for a fallback name, and then returns a new
	 * array where the filenames are rotated so that
	 * the fallback name (or the * nearest filename) appears first in the array.
	 * @param slotFileNames
	 * @param fallbackName
	 * @returns
	 */
	const getSlotfilesByDistance = (slotFileNames: string[], fallbackName: string) => {
		slotFileNames.sort()
		let low = 0,
			high = slotFileNames.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (slotFileNames[mid]! <= fallbackName) {
				low = mid + 1
			} else {
				high = mid
			}
		}

		const slotFileNamesByDistance = []

		for (let i = 0; i < slotFileNames.length; i++) {
			const index = (i + low) % slotFileNames.length
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- mod should not create out of index
			slotFileNamesByDistance.push(slotFileNames[index]!)
		}
		return slotFileNamesByDistance
	}

	let ongoingSave = undefined as any

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

	const saveChangesToDisk = async () => {
		if (ongoingSave) {
			console.log("scheduling next save")
			await ongoingSave.then(saveChangesToDisk)
			return
		}

		const awaitable = createAwaitable()
		ongoingSave = awaitable[0]
		const done = awaitable[1]

		if (!connectedFs) {
			throw new Error("not connected - connect using connect(fs, path) first")
		}

		// TODO get lock - so we don't expect further dirty flags comming up
		debug("saveChangesToWorkingCopy - reloadDirtySlotFiles")
		const loadResult = await loadSlotFilesFromWorkingCopy()

		// find free slots in existing slotFiles for transient entries or create transient files if needed
		const { reserverdSlotsByFile, transientSlotFiles } =
			distributeTransientEntries(transientSlotEntries)

		// process changed and transient (created) slotentries for existing slot files
		debug(
			"saveChangesToWorkingCopy - process changed and transient (created) slotentries for existing slot files"
		)
		for (const knownSlotFileStates of fileNamesToSlotfileStates.values()) {
			debug(
				"saveChangesToWorkingCopy - start proccessing " +
					connectedFs.path +
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
						connectedFs.path +
						knownSlotFileStates.slotFileName +
						".slot"
				)
				// no change in memory for the given file (no records changed, no new slots reserved by transient records)
				continue
			}

			const conflictingSlotFile = knownSlotFileStates.fsSlotFileState
			const memorySlotFile = structuredClone(knownSlotFileStates.memorySlotFileState)

			let slotFileStateToWrite: SlotFile<DocType> | undefined

			// we update all objects one by one and update the workingCopyState and the memoryOriginState
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

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we checked this earlier ts is wrong on the warning here
				const upsertedSlotEntry = changedSlotEntry ?? newSlotEntry!

				if (
					!conflictingSlotFile ||
					conflictingSlotFile.recordSlots[currentSlotIndex]?.slotEntryHash ===
						memorySlotFile.recordSlots[currentSlotIndex]?.slotEntryHash
				) {
					if (slotFileStateToWrite === undefined) {
						// if we have a conflicting slotfile we only apply changes in records that dont conflict
						slotFileStateToWrite = structuredClone(conflictingSlotFile ?? memorySlotFile)
					}

					slotFileStateToWrite.recordSlots[currentSlotIndex] = upsertedSlotEntry
					memorySlotFile.recordSlots[currentSlotIndex] = upsertedSlotEntry

					upsertedSlotEntry._writingFlag = true
				}
			}

			if (slotFileStateToWrite) {
				// NOTE: open thoughts
				// we await two operations here which could lead to simultanous changes until we locked
				// we could make this process intercept on detected changes...?
				const newSlotFileContent = await stringifySlotFile<DocType>(slotFileStateToWrite, slotSize)
				slotFileStateToWrite.contentHash = await hash(newSlotFileContent)

				// let newMemorySlotfileContent = newSlotFileContent
				// if (conflictingSlotFile) {

				// }

				// const memoryOriginSlotfileContent = await stringifySlotFile<DocType>(
				// 	memorySlotFile,
				// 	slotSize
				// )
				// newMemoryOriginStateToWrite.contentHash = await hash(memorySlotFile

				// apply every non conflicting in memory state to the working copy
				debug("writing file" + connectedFs.path + knownSlotFileStates.slotFileName)
				await connectedFs.fs.writeFile(
					connectedFs.path + knownSlotFileStates.slotFileName + ".slot",
					newSlotFileContent
				)
				debug("file written writing file" + connectedFs.path + knownSlotFileStates.slotFileName)

				// cleanup change records and transients
				let outstandingChange = false
				if (reservedSlots) {
					for (const transientSlotEntry of reservedSlots.values()) {
						if (transientSlotEntry) {
							if (transientSlotEntry._writingFlag) {
								delete transientSlotEntry._writingFlag
								idToSlotFileName.set(transientSlotEntry.data.id, knownSlotFileStates.slotFileName)
								transientSlotEntries.delete(transientSlotEntry.data.id)
							} else {
								outstandingChange = true
								console.log("outst:" + JSON.stringify(transientSlotEntry))
							}
						}
					}
				}

				for (const [
					changedSlotIndex,
					changedSlotEntry,
				] of knownSlotFileStates.changedRecords.entries()) {
					if (changedSlotEntry) {
						if (changedSlotEntry._writingFlag) {
							delete changedSlotEntry._writingFlag
							delete knownSlotFileStates.changedRecords[changedSlotIndex]
						} else {
							outstandingChange = true
							console.log("outst:" + JSON.stringify(changedSlotEntry))
						}
					}
				}
				if (!outstandingChange) {
					// NOTE: deletion of the elements will keep empty slots - we wan't to check for length === 0 so we have to apply a new array here if all slots are empty
					knownSlotFileStates.changedRecords = []
					knownSlotFileStates.fsSlotFileState = undefined
					knownSlotFileStates.memorySlotFileState = slotFileStateToWrite
					knownSlotFileStates.workingCopyStateFlag = "loadrequested"
				} else {
					throw new Error(
						"simultanous write? or unresolved local conflict? conflictingState:" +
							JSON.stringify(conflictingSlotFile)
					)
				}
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

			const memoryStateSlotfileContent = await stringifySlotFile<DocType>(
				transientSlotFile,
				slotSize
			)

			// apply every non conflicting in memory state to the working copy
			await connectedFs.fs.writeFile(
				connectedFs.path + fileName + ".slot",
				memoryStateSlotfileContent
			)

			for (const transientSlotEntry of transientSlotFile.recordSlots) {
				if (transientSlotEntry?._writingFlag) {
					// TODO conflicting ids?
					delete transientSlotEntry._writingFlag
					idToSlotFileName.set(transientSlotEntry.data.id, fileName)
					transientSlotEntries.delete(transientSlotEntry.data.id)
				}
			}

			fileNamesToSlotfileStates.set(fileName, {
				slotFileName: fileName,
				workingCopyStateFlag: "loadrequested",
				fsSlotFileState: undefined,
				memorySlotFileState: transientSlotFile,
				changedRecords: [],
			})
			changeCallback("slots-changed")
		}
		ongoingSave = undefined
		done()
	}

	function distributeTransientEntries(
		transientSlotEntries: Map<string, TransientSlotEntry<DocType>>
	) {
		const transientSlotFiles = new Map<string, SlotFile<DocType>>()
		const reserverdSlotsByFile = new Map<string, (TransientSlotEntry<DocType> | undefined)[]>()

		debug("saveChangesToWorkingCopy - find or create free buckets for transient entries")
		transientSlotFileSearch: for (const transientSlotEntry of transientSlotEntries.values()) {
			// TODO take care of possible conflicting record id as well -> this is a possible sitiuation on simultanous inserts on the same slot
			const fallbackFileName = transientSlotEntry.slotEntryIdHash.slice(0, fileNameCharacters)

			// check transientSlot files first
			for (const transientSlotFile of transientSlotFiles.values()) {
				if (!transientSlotFile.recordSlots[transientSlotEntry.index]) {
					debug(
						"saveChangesToWorkingCopy - using an exisitng transient slotfile (" +
							transientSlotFile +
							") found"
					)
					transientSlotFile.recordSlots[transientSlotEntry.index] = transientSlotEntry
					continue transientSlotFileSearch
				}
			}

			// TODO if we create more than slotCount/x records - skip writing to non transient files to avoid conflicts
			// NOTE: if we can ask lix for "unmerged" records we could be even better on this threashold
			const existingSlotFilesSortedByDistance = getSlotfilesByDistance(
				[...fileNamesToSlotfileStates.keys()],
				fallbackFileName
			)
			for (const slotFileNameToCheck of existingSlotFilesSortedByDistance) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const slotFileToCheck = fileNamesToSlotfileStates.get(slotFileNameToCheck)!
				const slotsUsedByTransientsInSlotFile = reserverdSlotsByFile.get(slotFileNameToCheck) ?? []

				if (
					!slotsUsedByTransientsInSlotFile[transientSlotEntry.index] &&
					!slotFileToCheck.memorySlotFileState.recordSlots[transientSlotEntry.index] &&
					!slotFileToCheck.fsSlotFileState?.recordSlots[transientSlotEntry.index]
				) {
					debug(
						"saveChangesToWorkingCopy - free slot in exisitng slotfile (" +
							slotFileNameToCheck +
							") found"
					)
					slotsUsedByTransientsInSlotFile[transientSlotEntry.index] = transientSlotEntry
					reserverdSlotsByFile.set(slotFileNameToCheck, slotsUsedByTransientsInSlotFile)
					continue transientSlotFileSearch
				}
			}

			// we don't have a file that can store the record - create a new transientSlotFile
			const newTransientSlotFile: SlotFile<DocType> = {
				exists: false,
				recordSlots: [],
				contentHash: undefined,
			}
			debug("saveChangesToWorkingCopy - no free slot found - createing a new transient slot file")
			newTransientSlotFile.recordSlots[transientSlotEntry.index] = transientSlotEntry
			transientSlotFiles.set(fallbackFileName, newTransientSlotFile)
		}
		return { reserverdSlotsByFile, transientSlotFiles }
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
	const getSlotEntryById = async (id: string) => {
		debug("getSlotEntryById")
		const transientSlotEntry = transientSlotEntries.get(id)
		// transient Slot entries can not conflict - just return the current one
		if (transientSlotEntry) return transientSlotEntry

		debug("getSlotEntryById - no transient slotEntry")

		const recordSlotfile = getSlotFileByRecordId(id)

		const { slotIndex } = await extractInfoFromId(id)

		if (!recordSlotfile) {
			debug("getSlotEntryById - not found in slot files")
		} else {
			debug("getSlotEntryById - recordSlotfile exists")
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

			const currentRecordState: SlotEntry<DocType> = {
				slotEntryHash: currentState.hash,
				hash: deepFreeze(currentState.hash),
				data: deepFreeze(currentState.data),
				// localConflict,
				mergeConflict,
				index: currentState.index,
			}

			return currentRecordState
		}
		return
	}

	let abortController: AbortController | undefined

	/**
	 *
	 */
	const startWatchingSlotfileChanges = () => {
		if (!connectedFs) {
			throw new Error("not connected")
		}

		const abortController = new AbortController()

		// NOTE: watch will not throw an exception since we don't await it here.
		const watcher = connectedFs.fs.watch(connectedFs.path, {
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

	const stopWatchingSlotfileChanges = () => {
		abortController?.abort()
	}

	const extractInfoFromId = async (docId: string) => {
		const entryIdHash = await hash(docId)
		const slotIndex = parseInt(entryIdHash.slice(-slotCharacters), 16)

		return {
			slotIndex,
			entryIdHash,
		}
	}

	const findDocumentsById = async (
		docIds: string[] /*, withDeleted: boolean*/
	): SlotEntry<DocType>[] => {
		const matchingDocuments: SlotEntry<DocType>[] = []

		for (const docId of docIds) {
			const slotEntry = await getSlotEntryById(docId)
			// TODO move deletion to application level?
			// if (slotEntry && (!slotEntry._deleted || withDeleted)) {
			if (slotEntry) {
				matchingDocuments.push(slotEntry)
			}
		}
		return matchingDocuments
	}

	return {
		/**
		 * internal properties used for debug purpose (checking internal states during tests)
		 */
		_internal: {
			fileNamesToSlotfileStates,
			transientSlotEntries,
		},
		connect: async (fs: NodeishFilesystem, path: string) => {
			if (connectedFs || abortController) {
				throw new Error("Connected already!")
			}

			fs.mkdir(path, { recursive: true })

			connectedFs = {
				fs,
				path,
			}

			startWatchingSlotfileChanges()

			// save and load all slot files from disc
			await saveChangesToDisk()

			// TODO listen to lix conflict states
		},
		disconnect: () => {
			connectedFs = undefined
			stopWatchingSlotfileChanges()
		},
		insert: async (document: DocType, saveToDisk = true) => {
			const documentId = document[idProperty]

			const existingSlotRecord = await getSlotEntryById(documentId)
			if (existingSlotRecord) {
				throw new Error("Object with id " + documentId + " exists already - can't insert")
			}

			const normalizedObject = normalizeObject(document)
			const stringifiedObject = JSON.stringify(normalizedObject)
			const objectHash = await hash(stringifiedObject)
			const { slotIndex, entryIdHash } = await extractInfoFromId(document.id)

			// the last n characters of the hash represent the insert positon

			// const slotIndex = parseInt(entryIdHash.slice(-slotCharacters), 16)
			// console.log(
			// 	"SLOT INDEX FOR INSERT RECORD:" +
			// 		slotIndex +
			// 		" hash " +
			// 		objectHash +
			// 		" characters " +
			// 		fileNameCharacters
			// )

			const newSlotEntry: TransientSlotEntry<DocType> = {
				// the hash of the object will not stay stable over the livetime of the record - the index does
				index: slotIndex,
				hash: objectHash,
				data: JSON.parse(stringifiedObject),
				slotEntryHash: objectHash,
				slotEntryIdHash: entryIdHash,
			}

			transientSlotEntries.set(documentId, newSlotEntry)
			changeCallback("record-change")
			changeCallback("records-change", await findDocumentsById([documentId]))
			// TODO trigger save

			// TODO trigger add event
			// TODO return promise that can be awaited - to ensure operation landed on disc
			if (connectedFs && saveToDisk) {
				// TODO should we always return a promis even if we are not connected?
				// should we return a save method that can be called explicetly?
				return saveChangesToDisk()
			}
		},
		update: async (document: DocType, saveToDisk = true) => {
			// TODO check phantoms
			debug("UPDATE")
			const documentId = document[idProperty]
			const existingSlotEntry = await getSlotEntryById(documentId)

			if (!existingSlotEntry) {
				throw new Error("Object with id " + documentId + " does not exist, can't update")
			}

			// if (existingSlotEntry._deleted) {
			// 	throw new Error("Slot entry was deleted - update no longer possible")
			// }

			const { entryIdHash } = await extractInfoFromId(documentId)
			const normalizedObject = normalizeObject(document)
			const stringifiedObject = JSON.stringify(normalizedObject)
			const objectHash = await hash(stringifiedObject)
			// update slot files changed records
			const updatedSlotEntry: TransientSlotEntry<DocType> = {
				index: existingSlotEntry.index,
				hash: objectHash,
				data: JSON.parse(stringifiedObject), // we parse it to get a clone of the object
				mergeConflict: existingSlotEntry.mergeConflict,
				// TODO rething the hash here - should we use the conflicting has as well? compare parseSlotFile `slotEntryHash: recordOnSlot.theirs.hash + recordOnSlot.mine.hash,`
				slotEntryHash: objectHash,
				slotEntryIdHash: entryIdHash,
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
			changeCallback("records-change")
			changeCallback("records-change", await findDocumentsById([documentId]))
			if (connectedFs && saveChangesToDisk) {
				return saveChangesToDisk()
			}
		},
		save: () => {
			return saveChangesToDisk()
		},
		loadSlotFilesFromWorkingCopy,
		findDocumentsById,
		readAll: async (/*includeDeleted: boolean = false*/) => {
			const objectIds: string[] = [...transientSlotEntries.keys(), ...idToSlotFileName.keys()]
			// const allObjectsById = new Map<string, SlotEntry<DocType>>()
			const matchingSlotEntries: SlotEntry<DocType>[] = []

			for (const docId of objectIds) {
				const slotEntry = await getSlotEntryById(docId)
				// TODO move deletion to application level?
				// if (slotEntry && (!slotEntry._deleted || withDeleted)) {
				if (slotEntry) {
					matchingSlotEntries.push(slotEntry)
				}
			}
			return matchingSlotEntries

			// // start with phantom record states
			// for (const transientSlotEntry of transientSlotEntries.values()) {
			// 	if (transientSlotEntry) {
			// 		objectIds.push(objectIds);
			// 		// TODO we need to also add the conflicting entries
			// 		allObjectsById.set(transientSlotEntry.data.id, transientSlotEntry)
			// 	}
			// }

			// // get all records from the slot files
			// for (const slotFile of fileNamesToSlotfileStates.values()) {
			// 	for (const [
			// 		slotIndex,
			// 		slotFileSlotEntry,
			// 	] of slotFile.memoryOriginState.recordSlots.entries()) {
			// 		// favor changes over persisted
			// 		const changedSlot = slotFile.changedRecords[slotIndex]
			// 		if (changedSlot) {
			// 			// TODO how shall we handle conflicting entries here?
			// 			// if (!changedSlot._deleted || includeDeleted) {
			// 			allObjectsById.set(changedSlot.data.id, changedSlot)
			// 			// }
			// 		} else {
			// 			if (slotFileSlotEntry /*&& (!slotFileSlotEntry._deleted || includeDeleted)*/) {
			// 				// TODO how shall we handle conflicting entries here?
			// 				allObjectsById.set(slotFileSlotEntry.data.id, slotFileSlotEntry)
			// 			}
			// 		}
			// 	}
			// }

			// // TODO sort?
			// // TODO filter deleted && (!phatomSlotEntry._deleted || includeDeleted)
			// return deepFreeze([...allObjectsById.values()])
			// .filter((slotEntry) => includeDeleted || !slotEntry._deleted)
			// TODO how shall we handle conflicting entries here?
		},
		resolveMergeConflict() {},
	}
}

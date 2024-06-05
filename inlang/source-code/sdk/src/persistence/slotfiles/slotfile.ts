import type { NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
const debug = _debug("sdk:slotfile")

let nodeCrypto: any = undefined

if (typeof crypto === "undefined" && typeof process !== "undefined" && process?.versions?.node) {
	nodeCrypto = await import("node:crypto")
}

/**
 * sync env independet implementation of  sha-256 hash function
 * @param inputStr string to create a hash for
 * @returns a 20 byte hex based hash created using sha-256
 */
export function hash(inputStr: string) {
	// @ts-ignore
	if (
		typeof nodeCrypto !== "undefined" &&
		typeof process !== "undefined" &&
		process?.versions?.node
	) {
		const hash = nodeCrypto.createHash("sha256", "")
		hash.update(inputStr)
		// @ts-ignore
		return hash.digest("hex")
	} else if (typeof crypto !== "undefined") {
		const utf8 = new TextEncoder().encode(inputStr)
		return crypto.subtle.digest("SHA-256", utf8).then((hashBuffer) => {
			const hashArray = [...new Uint8Array(hashBuffer)]
			const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, "0")).join("")
			return hashHex
		})
	}

	throw new Error("Could not find crypto features in runtime")
}

// NOTE: we coult be more general for primary key field (see: https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106) but enougth for the POC
type HasId = {
	id: string
}

export type SlotEntry<DocType extends HasId> = {
	hash: string
	// a normalized object
	data: DocType
	index: number
	_deleted: boolean
	_writingFlag?: boolean
}

export type SlotEntryStates<DocType extends HasId> = {
	remoteState: SlotEntry<DocType> | undefined
	conflictState: SlotEntry<DocType> | undefined
	headState: SlotEntry<DocType> | undefined
	workingCopyState: SlotEntry<DocType> | undefined
	memoryOriginState: SlotEntry<DocType> | undefined
	memoryState: SlotEntry<DocType>
}

/**
 * conflict types:
 * remoteState != workingCopyState - git merge conflict
 * workingCopyState != memoryState - parallel edit on local fs (heighest prio?)
 *
 * how to solve a conflict? Set a resolution hash?
 *
 * if you call update it updates the memory state always, its returned persistence promise will raise an error with the conflicting states
 * if the write/push read operation raises a conflict - it will set the record into conflicting state (with all three states available in the conflict property)
 * a conflict can be solved by calling resolve(hash) where hash is one of the states of the records
 */

type SlotFile<DocType extends HasId> = {
	exists: boolean
	contentHash: string | undefined
	recordSlots: (SlotEntry<DocType> | null)[]
}

export type SlotFileStates<DocType extends HasId> = {
	// collection: string,
	slotFileName: string
	// if the remote state of the file would conflict - it contains the conflicting state
	// remoteState: ( SlotEntry<DocType> | null )[] | undefined
	// // if current head is conflicting it contains the conflicting state of the file
	// conflictingState: ( SlotEntry<DocType> | null )[] | undefined
	// // the state of the head commit state of the current branch
	// headState: ( SlotEntry<DocType> | null )[] | undefined
	workingCopyStateFlag: "loaded" | "loadrequested" | "loading"
	conflictingWorkingFile: SlotFile<DocType> | undefined
	memoryOriginState: SlotFile<DocType>
	changedRecords: (SlotEntry<DocType> | null)[]
}

// Hash slot selection algorithm:
// For a storage the number of slots need to be defiend at the beginning.
// this value defines the number of slots per slot file.
//
// To reach a good distribution over slots possible values are
// - like 16 256 4096 65536 ...
//
// For this example we use 256 - so a slot file contains
//
// given a hash from a stringified json object:
// 4ce286da8574e34c76d23769fd1b2c6c532e1cbc4ffde58204f9fa3e37cc76f8
// ^^^															^^^
// 4096 Slots -> 3 characters

// extract slot index by the last n characters
// check if the slot is free in one of the available slot files (in alphabetic order)
// -> if a free slot is found, use it
// -> find the first free file name by going from left to right
// if non of the available slot files has a slot free on the slot index
// -

function stringifySlotFile<DocType extends HasId>(slotFile: SlotFile<DocType>) {
	let slotFileContent = "[\n"
	for (const slotfileEntry of slotFile.recordSlots) {
		if (slotfileEntry === null) {
			slotFileContent += "null,"
		} else {
			const soltFileEntryString = JSON.stringify(slotfileEntry.data)
			const slotFileEntyHash = hash(soltFileEntryString)

			slotFileContent +=
				'{"hash":"' +
				slotFileEntyHash +
				'", "data": ' +
				soltFileEntryString +
				', "_deleted": ' +
				slotfileEntry._deleted +
				"},"
		}

		slotFileContent += "\n\n\n\n"
	}
	slotFileContent += "null]"
	return slotFileContent
}

function parseSlotFile(slotFileContent: string) {
	const slotFileContentParsed = JSON.parse(slotFileContent)

	// remove leading comma element
	slotFileContentParsed.splice(-1)

	for (const [slotIndex, recordOnSlot] of slotFileContentParsed.entries()) {
		if (recordOnSlot) {
			recordOnSlot.index = slotIndex
		}
	}
	return slotFileContentParsed
}

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
	const characters = 1

	const idToSlotFileName = new Map<string, string>()

	// appended or update in sert
	const fileNamesToSlotfileStates = new Map<string, SlotFileStates<DocType>>()

	// records that have been inserted but not picked up for persistence yet
	const phantomSlotEntries = new Map<string, SlotEntry<DocType>>()

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
		const result = {
			created: [] as string[],
			updated: [] as string[],
			conflicting: [] as string[],
		}

		debug("loadSlotFileFromWorkingCopy " + slotFileName)
		// NOTE we can use lix to check if the current file is conflicting and load the conflicting state
		const loadedSlotFilesBeforeLoad = fileNamesToSlotfileStates.get(slotFileName)

		if (loadedSlotFilesBeforeLoad) {
			if (loadedSlotFilesBeforeLoad.workingCopyStateFlag === "loadrequested") {
				loadedSlotFilesBeforeLoad.workingCopyStateFlag = "loading"
				debug("loadSlotFileFromWorkingCopy " + slotFileName + " state -> loading")
			} else {
				debug(
					"loadSlotFileFromWorkingCopy " +
						slotFileName +
						" skipped state was " +
						loadedSlotFilesBeforeLoad.workingCopyStateFlag +
						" not loadrequested"
				)
				return result
			}
		}

		const slotFileContent = await fs.readFile(path + slotFileName + ".slot", { encoding: "utf-8" })
		const slotFileContentHash = hash(slotFileContent)

		if (
			loadedSlotFilesBeforeLoad &&
			loadedSlotFilesBeforeLoad.memoryOriginState?.contentHash === slotFileContentHash
		) {
			debug("loadSlotFileFromWorkingCopy " + slotFileName + " hash was equal state -> loaded")
			loadedSlotFilesBeforeLoad.workingCopyStateFlag = "loaded"
			// content is equal - no further loading needed
			return result
		}

		const slotFileContentParsed = parseSlotFile(slotFileContent)

		const freshSlotfile: SlotFile<DocType> = Object.freeze({
			contentHash: slotFileContentHash,
			exists: true,
			recordSlots: slotFileContentParsed,
		})

		if (loadedSlotFilesBeforeLoad === undefined) {
			// Load new, yet unknown slot file to memory
			const addedSlotFileStates: SlotFileStates<DocType> = {
				slotFileName: slotFileName,
				conflictingWorkingFile: undefined,
				workingCopyStateFlag: "loaded",
				memoryOriginState: freshSlotfile,
				changedRecords: new Array<null | SlotEntry<DocType>>(slotSize).fill(null),
			}

			const slotIndex = 0
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
			const memoryOriginState = loadedSlotFilesBeforeLoad.memoryOriginState

			if (memoryOriginState === undefined) {
				throw new Error(
					"memory origin state should exist for files we read from the disc (creation conflict??)"
				)
			}

			const mergeResult = mergeUnconflictingRecords(
				memoryOriginState,
				freshSlotfile,
				loadedSlotFilesBeforeLoad.changedRecords
			)

			debug(
				"loadSlotFileFromWorkingCopy - mergeUnconflictingRecords done,  updating slot state to " +
					loadedSlotFilesBeforeLoad.workingCopyStateFlag ===
					"loadrequested"
					? "loadrequested"
					: "loaded"
			)

			const updatedSlotfileStates: SlotFileStates<DocType> = {
				slotFileName: loadedSlotFilesBeforeLoad.slotFileName,
				changedRecords: loadedSlotFilesBeforeLoad.changedRecords,
				memoryOriginState: mergeResult.mergedState,
				conflictingWorkingFile:
					mergeResult.conflictingSlotIndexes.length > 0 ? freshSlotfile : undefined,

				// check that no other load request hit in in the meantime
				workingCopyStateFlag:
					loadedSlotFilesBeforeLoad.workingCopyStateFlag === "loadrequested"
						? "loadrequested"
						: "loaded",
			}

			fileNamesToSlotfileStates.set(updatedSlotfileStates.slotFileName, updatedSlotfileStates)

			for (const updatedSlotIndex of mergeResult.updatedSlotIndexes) {
				const updatedRecordId =
					mergeResult.mergedState.recordSlots[updatedSlotIndex]?.data[idProperty]
				if (updatedRecordId) {
					idToSlotFileName.set(updatedRecordId, loadedSlotFilesBeforeLoad.slotFileName)
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

	const findClosestIndex = (list: string[], newElement: string) => {
		let low = 0,
			high = list.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (list[mid]! <= newElement) {
				low = mid + 1
			} else {
				high = mid
			}
		}

		return low
	}

	const saveChangesToWorkingCopy = async () => {
		// TODO get lock - so we don't expect further dirty flags comming up
		debug("saveChangesToWorkingCopy - reloadDirtySlotFiles")
		await reloadDirtySlotFiles()

		// distribute phantoms

		const phantomSlotFiles = new Map<string, SlotFile<DocType>>()
		let slotFileNames = [...fileNamesToSlotfileStates.keys()].sort()
		const slotsUsedByPhantoms = new Map<string, SlotEntry<DocType>[]>()

		// find closed slot file with empty slot and use it - if no slot is available create a new slot file
		phantomToFindSlopForLoop: for (const phantom of phantomSlotEntries.values()) {
			const fileName = phantom.hash.slice(0, characters)
			const startIndex = findClosestIndex(slotFileNames, fileName)

			for (let i = 0; i < slotFileNames.length; i++) {
				const index = (i + startIndex) % slotFileNames.length
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- one of the state file collection must contain the name
				const slotFileNameToCheck = slotFileNames[index]!

				const currentSlotsUsedByPhantoms = slotsUsedByPhantoms.get(fileName) ?? []

				const slotFileToCheck = fileNamesToSlotfileStates.get(slotFileNameToCheck)
				if (currentSlotsUsedByPhantoms.find((slotEntry) => slotEntry.index === phantom.index)) {
					// slot is used by phantom
				} else if (slotFileToCheck) {
					if (
						!slotFileToCheck.memoryOriginState.recordSlots[phantom.index] &&
						!slotFileToCheck.conflictingWorkingFile?.recordSlots[phantom.index]
					) {
						// free slot in persisted file found
						currentSlotsUsedByPhantoms[phantom.index] = phantom
						slotsUsedByPhantoms.set(slotFileNameToCheck, currentSlotsUsedByPhantoms)
						continue phantomToFindSlopForLoop
					}
				} else {
					if (!phantomSlotFiles.get(slotFileNameToCheck)?.recordSlots[phantom.index]) {
						// free slot in phantom found
						currentSlotsUsedByPhantoms[phantom.index] = phantom
						slotsUsedByPhantoms.set(slotFileNameToCheck, currentSlotsUsedByPhantoms)
						continue phantomToFindSlopForLoop
					}
				}
			}

			// seems like we didn't find a slot - create a new file
			const newPhantomSlotFile: SlotFile<DocType> = {
				exists: false,
				recordSlots: new Array<null | SlotEntry<DocType>>(slotSize).fill(null),
				contentHash: undefined,
			}
			newPhantomSlotFile.recordSlots[phantom.index] = phantom
			phantomSlotFiles.set(fileName, newPhantomSlotFile)
			slotFileNames.push(fileName)
			slotFileNames = slotFileNames.sort()
		}

		// get all changes
		for (const knownSlotFileStates of fileNamesToSlotfileStates.values()) {
			debug(
				"saveChangesToWorkingCopy - start proccessing " +
					path +
					knownSlotFileStates.slotFileName +
					".slot"
			)
			// assert that we don't have any dirty states
			if (knownSlotFileStates.workingCopyStateFlag !== "loaded") {
				throw new Error(
					"a new dirty flag during save detected? " +
						knownSlotFileStates.slotFileName +
						" " +
						knownSlotFileStates.workingCopyStateFlag
				)
			}

			const slotsUsedByPhantomsCurrentFile = slotsUsedByPhantoms.get(
				knownSlotFileStates.slotFileName
			)

			if (
				!knownSlotFileStates.changedRecords.find((record) => record) &&
				!slotsUsedByPhantomsCurrentFile?.find((record) => record)
			) {
				continue
			}

			const conflictingSlotFile = knownSlotFileStates.conflictingWorkingFile
			const memorySlotFile = structuredClone(knownSlotFileStates.memoryOriginState)

			if (conflictingSlotFile) {
				// we update all objects one by one and update the workingCopyState and the memoryOriginState
				const workingCopyStateToWrite = structuredClone(conflictingSlotFile)
				const newMemoryOriginStateToWrite = memorySlotFile

				for (const [
					changedSlotIndex,
					changedSlotEntry,
				] of knownSlotFileStates.changedRecords.entries()) {
					if (
						changedSlotEntry &&
						conflictingSlotFile.recordSlots[changedSlotIndex]?.hash ===
							memorySlotFile.recordSlots[changedSlotIndex]?.hash
					) {
						// reset hash to trigger write
						workingCopyStateToWrite.contentHash = undefined
						workingCopyStateToWrite.recordSlots[changedSlotIndex] = changedSlotEntry

						newMemoryOriginStateToWrite.contentHash = undefined
						newMemoryOriginStateToWrite.recordSlots[changedSlotIndex] = changedSlotEntry

						changedSlotEntry._writingFlag = true
					}

					const phantomInSlot = slotsUsedByPhantomsCurrentFile?.[changedSlotIndex]
					if (phantomInSlot) {
						workingCopyStateToWrite.contentHash = undefined
						workingCopyStateToWrite.recordSlots[changedSlotIndex] = phantomInSlot

						newMemoryOriginStateToWrite.contentHash = undefined
						newMemoryOriginStateToWrite.recordSlots[changedSlotIndex] = phantomInSlot

						phantomInSlot._writingFlag = true
					}
				}

				if (workingCopyStateToWrite.contentHash === undefined) {
					const workingCopySlotfileContent = stringifySlotFile<DocType>(workingCopyStateToWrite)
					const workingCopySlotfileContentHash = hash(workingCopySlotfileContent)

					// apply every non conflicting in memory state to the working copy
					debug("writing file" + path + knownSlotFileStates.slotFileName)
					await fs.writeFile(
						path + knownSlotFileStates.slotFileName + ".slot",
						stringifySlotFile<DocType>(workingCopyStateToWrite)
					)

					// cleanup change records and phantoms

					for (const [
						changedSlotIndex,
						changedSlotEntry,
					] of knownSlotFileStates.changedRecords.entries()) {
						if (changedSlotEntry?._writingFlag) {
							knownSlotFileStates.changedRecords[changedSlotIndex] = null
						}
					}

					for (const [id, phantom] of phantomSlotEntries.entries()) {
						if (phantom._writingFlag) {
							idToSlotFileName.set(id, knownSlotFileStates.slotFileName)
							phantomSlotEntries.delete(id)
						}
					}

					workingCopyStateToWrite.contentHash = workingCopySlotfileContentHash

					const memoryOriginSlotfileContent = stringifySlotFile<DocType>(
						newMemoryOriginStateToWrite
					)
					newMemoryOriginStateToWrite.contentHash = hash(memoryOriginSlotfileContent)

					knownSlotFileStates.conflictingWorkingFile = workingCopyStateToWrite
					knownSlotFileStates.memoryOriginState = newMemoryOriginStateToWrite
					knownSlotFileStates.workingCopyStateFlag = "loadrequested"
				}
			} else {
				const newMemoryOriginStateToWrite = memorySlotFile

				// slot file not conflicting nothing to compare the records against
				for (const [
					changedSlotIndex,
					changedSlotEntry,
				] of knownSlotFileStates.changedRecords.entries()) {
					// debug("working in the changed record")
					// debug(changedSlotEntry)
					if (changedSlotEntry) {
						changedSlotEntry._writingFlag = true
						newMemoryOriginStateToWrite.recordSlots[changedSlotIndex] = changedSlotEntry
					}
				}

				if (slotsUsedByPhantomsCurrentFile) {
					let slotPos = 0
					for (const phantomInSlot of slotsUsedByPhantomsCurrentFile) {
						//debug("working in the phantom state")

						// debug(phantomInSlot)
						if (phantomInSlot) {
							newMemoryOriginStateToWrite.contentHash = undefined
							phantomInSlot._writingFlag = true
							newMemoryOriginStateToWrite.recordSlots[slotPos] = phantomInSlot
						}
						slotPos += 1
					}
				}

				const memoryStateSlotfileContent = stringifySlotFile<DocType>(newMemoryOriginStateToWrite)

				// apply every non conflicting in memory state to the working copy
				debug(
					"saveChangesToWorkingCopy - no conflicts - saving to " +
						path +
						knownSlotFileStates.slotFileName +
						".slot"
				)
				await fs.writeFile(
					path + knownSlotFileStates.slotFileName + ".slot",
					memoryStateSlotfileContent
				)

				for (const [
					changedSlotIndex,
					changedSlotEntry,
				] of knownSlotFileStates.changedRecords.entries()) {
					if (changedSlotEntry?._writingFlag) {
						knownSlotFileStates.changedRecords[changedSlotIndex] = null
					}
				}

				for (const [id, phantom] of phantomSlotEntries.entries()) {
					if (phantom._writingFlag) {
						idToSlotFileName.set(id, knownSlotFileStates.slotFileName)
						phantomSlotEntries.delete(id)
					}
				}

				knownSlotFileStates.memoryOriginState = newMemoryOriginStateToWrite
				debug("saveChangesToWorkingCopy - save successfull - mark for reload")
				knownSlotFileStates.workingCopyStateFlag = "loadrequested"
			}
		}

		// write phantom slot files
		for (const [fileName, phantomSlotFile] of phantomSlotFiles.entries()) {
			for (const slot of phantomSlotFile.recordSlots) {
				if (slot) {
					slot._writingFlag = true
				}
			}

			const memoryStateSlotfileContent = stringifySlotFile<DocType>(phantomSlotFile)

			// apply every non conflicting in memory state to the working copy
			await fs.writeFile(path + fileName + ".slot", memoryStateSlotfileContent)

			for (const phantomSlot of phantomSlotFile.recordSlots) {
				if (phantomSlot?._writingFlag) {
					idToSlotFileName.set(phantomSlot.data.id, fileName)

					phantomSlotEntries.delete(phantomSlot.data.id)
				}
			}

			fileNamesToSlotfileStates.set(fileName, {
				slotFileName: fileName,
				workingCopyStateFlag: "loadrequested",
				conflictingWorkingFile: undefined,
				memoryOriginState: phantomSlotFile,
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
		const phantomSlotEntry = phantomSlotEntries.get(id)
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
			const slotIndex = parseInt(objectHash.slice(-characters), 16)
			console.log(
				"SLOT INDEX FOR INSERT RECORD:" +
					slotIndex +
					" hash " +
					objectHash +
					" characters " +
					characters
			)

			const newSlotEntry = {
				// the hash of the object will not stay stable over the livetime of the record - the index does
				index: slotIndex,
				hash: objectHash,
				data: normalizedObject,
				_deleted: false,
			}

			phantomSlotEntries.set(documentId, newSlotEntry)
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
				phantomSlotEntries.set(documentId, updatedSlotEntry)
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
			for (const phatomSlotEntry of phantomSlotEntries.values()) {
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

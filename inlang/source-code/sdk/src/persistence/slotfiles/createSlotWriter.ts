import type { NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
import type { SlotEntry, TransientSlotEntry } from "./types/SlotEntry.js"
import { hash } from "./utill/hash.js"
import { stringifySlotFile } from "./utill/stringifySlotFile.js"
import type { SlotFile } from "./types/SlotFile.js"
import type { HasId } from "./types/HasId.js"
import { deepFreeze } from "./utill/deepFreeze.js"
import { sortNamesByDistance } from "./utill/sortNamesByDistance.js"
import createSlotStorageReader from "./createSlotReader.js"

type createSlotStorageParams = {
	path: string
	slotsPerFile: number
	fileNameCharacters: number
	watch: true
	fs: Pick<NodeishFilesystem, "readFile" | "readdir" | "writeFile" | "mkdir" | "watch">
}

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
export default async function createSlotStorageWriter<DocType extends HasId>({
	fs,
	path,
	watch,
	slotsPerFile,
	fileNameCharacters,
}: createSlotStorageParams) {
	// TODO add config to toggle creation - default should check if path exists instead
	await fs.mkdir(path, { recursive: true })

	const slotFileReader = await createSlotStorageReader<DocType>({
		fs,
		path,
		watch,
	})

	const debug = _debug("sdk:slotfile:" + path)

	// property to use to test for identity of an object within a collection
	// NOTE: use schema primary key like in https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106
	const idProperty = "id"

	// We use the characters from the content sha encoded in hex so any 16^x value possible
	const slotSize = slotsPerFile
	const slotCharacters = (slotSize - 1).toString(16).length

	// records that have been inserted and not persisted
	const transientSlotEntries = new Map<string, TransientSlotEntry<DocType>>()

	const normalizeObject = (objectToNormalize: any) => {
		return objectToNormalize // TODO normalize json
	}

	let ongoingSave = undefined as any

	const createAwaitable = () => {
		let resolve: () => void
		let reject: () => void

		const promise = new Promise<void>((res, rej) => {
			resolve = res
			reject = rej
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return [promise, resolve!, reject!] as [
			awaitable: Promise<void>,
			resolve: () => void,
			reject: (e: unknown) => void
		]
	}

	const saveChangesToDisk = async () => {
		if (ongoingSave) {
			debug("scheduling next save")
			return await ongoingSave.then(saveChangesToDisk)
		}

		const awaitable = createAwaitable()
		ongoingSave = awaitable[0]
		const done = awaitable[1]

		// TODO get lock - so we don't expect further dirty flags comming up
		debug("saveChangesToWorkingCopy - reloadDirtySlotFiles")
		await slotFileReader._internal.loadSlotFilesFromFs()

		const changedIds = new Set<string>()

		// find free slots in existing slotFiles for transient entries or create transient files if needed
		const { reserverdSlotsByFile, transientSlotFiles } =
			distributeTransientEntries(transientSlotEntries)

		// process changed and transient (created) slotentries for existing slot files
		debug(
			"saveChangesToWorkingCopy - process changed and transient (created) slotentries for existing slot files"
		)
		for (const knownSlotFileStates of slotFileReader._internal.fileNamesToSlotfileStates.values()) {
			debug(
				"saveChangesToWorkingCopy - start proccessing " +
					path +
					knownSlotFileStates.slotFileName +
					".slot"
			)

			// assert that the current slot file is in loaded state - no event has marked it as dirty - this should not happen since we locked the file...
			if (knownSlotFileStates.stateFlag !== "loaded") {
				throw new Error(
					"a new dirty flag during save detected? " +
						knownSlotFileStates.slotFileName +
						" " +
						knownSlotFileStates.stateFlag
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

			debug(
				"saveChangesToWorkingCopy - CHANGES" + path + knownSlotFileStates.slotFileName + ".slot"
			)
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
				debug("writing file" + path + knownSlotFileStates.slotFileName)
				await fs.writeFile(path + knownSlotFileStates.slotFileName + ".slot", newSlotFileContent)
				debug("file written writing file" + path + knownSlotFileStates.slotFileName)

				const updatedSlotEntries = [] as SlotEntry<DocType>[]

				// cleanup change records and transients
				let outstandingChange = false
				if (reservedSlots) {
					for (const transientSlotEntry of reservedSlots.values()) {
						if (transientSlotEntry) {
							if (transientSlotEntry._writingFlag) {
								delete transientSlotEntry._writingFlag
								slotFileReader._internal.idToSlotFileName.set(
									transientSlotEntry.data.id,
									knownSlotFileStates.slotFileName
								)
								transientSlotEntries.delete(transientSlotEntry.data.id)
								updatedSlotEntries.push(transientSlotEntry)
								changedIds.add(transientSlotEntry.data.id)
							} else {
								outstandingChange = true
								debug("outst:" + JSON.stringify(transientSlotEntry))
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
							updatedSlotEntries.push(changedSlotEntry)
							changedIds.add(changedSlotEntry.data.id)
						} else {
							outstandingChange = true
							debug("outst:" + JSON.stringify(changedSlotEntry))
						}
					}
				}
				if (!outstandingChange) {
					// NOTE: deletion of the elements will keep empty slots - we wan't to check for length === 0 so we have to apply a new array here if all slots are empty
					knownSlotFileStates.changedRecords = []
					knownSlotFileStates.fsSlotFileState = undefined
					knownSlotFileStates.memorySlotFileState = slotFileStateToWrite
					knownSlotFileStates.stateFlag = "loadrequested"
					for (const updatedSlotEntry of updatedSlotEntries) {
						updateSlotEntryStates(updatedSlotEntry.data.id, updatedSlotEntry.index)
					}
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
			debug("saveChangesToWorkingCopy - write transient slotfiles - " + fileName)
			await fs.writeFile(path + fileName + ".slot", memoryStateSlotfileContent)

			slotFileReader._internal.fileNamesToSlotfileStates.set(fileName, {
				slotFileName: fileName,
				stateFlag: "loadrequested",
				fsSlotFileState: undefined,
				memorySlotFileState: transientSlotFile,
				changedRecords: [],
			})
			for (const transientSlotEntry of transientSlotFile.recordSlots) {
				if (transientSlotEntry?._writingFlag) {
					// TODO conflicting ids?
					delete transientSlotEntry._writingFlag
					slotFileReader._internal.idToSlotFileName.set(transientSlotEntry.data.id, fileName)
					transientSlotEntries.delete(transientSlotEntry.data.id)
					changedIds.add(transientSlotEntry.data.id)
					updateSlotEntryStates(transientSlotEntry.data.id, transientSlotEntry.index)
				}
			}
			slotFileReader._internal.changeCallback("api", "slots-changed")
		}
		if (changedIds.size > 0) {
			slotFileReader._internal.changeCallback("api", "records-change", [...changedIds.values()])
		}
		ongoingSave = undefined
		done()
	}

	const distributeTransientEntries = (
		transientSlotEntries: Map<string, TransientSlotEntry<DocType>>
	) => {
		const transientSlotFiles = new Map<string, SlotFile<DocType>>()
		const reserverdSlotsByFile = new Map<string, (SlotEntry<DocType> | undefined)[]>()

		debug("saveChangesToWorkingCopy - find or create free buckets for transient entries")
		transientSlotFileSearch: for (const transientSlotEntry of transientSlotEntries.values()) {
			// TODO take care of possible conflicting record id as well -> this is a possible sitiuation on simultanous inserts on the same slot
			const fallbackFileName = transientSlotEntry.idHash.slice(0, fileNameCharacters)

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
			const existingSlotFilesSortedByDistance = sortNamesByDistance(
				[...slotFileReader._internal.fileNamesToSlotfileStates.keys()],
				fallbackFileName
			)
			for (const slotFileNameToCheck of existingSlotFilesSortedByDistance) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const slotFileToCheck =
					slotFileReader._internal.fileNamesToSlotfileStates.get(slotFileNameToCheck)!
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

	const getSlotFileByRecordId = (id: string) => {
		const recordsSlotfileName = slotFileReader._internal.idToSlotFileName.get(id)
		if (recordsSlotfileName) {
			return slotFileReader._internal.fileNamesToSlotfileStates.get(recordsSlotfileName)
		}
		return undefined
	}

	// NEEDED BY UPDATE
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

		const currentRecordState: SlotEntry<DocType> = {
			slotEntryHash: currentState.hash,
			hash: deepFreeze(currentState.hash),
			data: deepFreeze(currentState.data),
			localConflict: localConflict,
			mergeConflict,
			index: currentState.index,
		}

		slotFileReader._internal.slotEntryStates.set(slotEntryId, currentRecordState)
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
		const transientSlotEntry = transientSlotEntries.get(id)
		// transient Slot entries can not conflict - just return the current one
		if (transientSlotEntry) return transientSlotEntry

		return slotFileReader._internal.getSlotEntryById(id)
	}

	const extractInfoFromId = async (docId: string) => {
		const entryIdHash = await hash(docId)
		const slotIndex = parseInt(entryIdHash.slice(-slotCharacters), 16)

		return {
			slotIndex,
			entryIdHash,
		}
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

	return {
		/**
		 * internal properties used for debug purpose (checking internal states during tests)
		 */
		...slotFileReader,
		insert: async (document: DocType, saveToDisk = true) => {
			const documentId = document[idProperty]

			const existingSlotRecord = getSlotEntryById(documentId)
			if (existingSlotRecord) {
				throw new Error("Object with id " + documentId + " exists already - can't insert")
			}

			const normalizedObject = normalizeObject(document)
			const stringifiedObject = JSON.stringify(normalizedObject)
			const objectHash = await hash(stringifiedObject)
			const { slotIndex, entryIdHash } = await extractInfoFromId(document.id)

			const newSlotEntry: TransientSlotEntry<DocType> = {
				// the hash of the object will not stay stable over the livetime of the record - the index does
				index: slotIndex,
				hash: objectHash,
				data: JSON.parse(stringifiedObject),
				slotEntryHash: objectHash,
				idHash: entryIdHash,
			}

			transientSlotEntries.set(documentId, newSlotEntry)

			slotFileReader._internal.changeCallback("api", "record-change")
			slotFileReader._internal.changeCallback("api", "records-change", [documentId])

			if (saveToDisk) {
				// TODO should we always return a promis even if we are not connected?
				// should we return a save method that can be called explicetly?
				return saveChangesToDisk()
			}
		},
		update: async (document: DocType, saveToDisk = true) => {
			debug("UPDATE")

			const documentId = document[idProperty]
			const existingSlotEntry = getSlotEntryById(documentId)

			if (!existingSlotEntry) {
				throw new Error("Object with id " + documentId + " does not exist, can't update")
			}

			// if (existingSlotEntry._deleted) {
			// 	throw new Error("Slot entry was deleted - update no longer possible")
			// }

			const normalizedObject = normalizeObject(document)
			const stringifiedObject = JSON.stringify(normalizedObject)
			const objectHash = await hash(stringifiedObject)
			// update slot files changed records
			const updatedSlotEntry: SlotEntry<DocType> = {
				index: existingSlotEntry.index,
				hash: objectHash,
				data: JSON.parse(stringifiedObject), // we parse it to get a clone of the object
				mergeConflict: existingSlotEntry.mergeConflict,
				// TODO rethink the hash here - should we use the conflicting has as well? compare parseSlotFile `slotEntryHash: recordOnSlot.theirs.hash + recordOnSlot.mine.hash,`
				slotEntryHash: objectHash,
			}

			const recordsSlotfileName = slotFileReader._internal.idToSlotFileName.get(documentId)

			if (recordsSlotfileName) {
				const recordSlotfile =
					slotFileReader._internal.fileNamesToSlotfileStates.get(recordsSlotfileName)

				if (!recordSlotfile) {
					throw Error("expected recordSlotfile not found")
				}
				recordSlotfile.changedRecords[existingSlotEntry.index] = updatedSlotEntry
			} else {
				// we are updating a transient object
				const idHash = (existingSlotEntry as TransientSlotEntry<DocType>).idHash
				if (!idHash) {
					throw Error("expected updated record to be transient")
				}

				transientSlotEntries.set(documentId, {
					...updatedSlotEntry,
					idHash: idHash,
				})
			}

			updateSlotEntryStates(documentId, existingSlotEntry.index)

			slotFileReader._internal.changeCallback("api", "records-change", [documentId])
			if (saveToDisk) {
				return saveChangesToDisk()
			}
		},
		save: () => {
			return saveChangesToDisk()
		},
		findDocumentsById,
		readAll: async (/*includeDeleted: boolean = false*/) => {
			const objectIds: string[] = [
				...transientSlotEntries.keys(),
				...slotFileReader._internal.idToSlotFileName.keys(),
			]
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
			slotFileReader.setCallback(callback)
		},
	}
}

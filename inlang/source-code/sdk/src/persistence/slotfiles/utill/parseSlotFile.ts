import type { HasId } from "../types/HasId.js"
import type { SlotEntry } from "../types/SlotEntry.js"

/**
 * Parses a string into an array of SlotEntries
 * It tries to parse it via JSON.parse in case of a conflict this approach will fail since conflict markers produce a non valid json.
 *
 * Conflict parsing:
 * In such a case the conflict markers get replaced with valid JSON to be able to propagate the conflict markers within the slot entry state:
 *
 * Turn:
 * ```
 * <<<< ./left.txt
 * { "slotEntry": 1, "value": "lunch" }
 * ====
 * { "slotEntry": 1, "value": "breakfast"}
 * >>>> ./right.txt
 * ```
 *
 * into
 *
 * ```
 * { "conflictMarkerStart": "<<<< ", "mineInfo": "./left.txt", "mine":
 * { "slotEntry": 1, "value": "lunch" },
 * "conflictMarkerSeparator": "===", "theirs":
 * { "slotEntry": 1, "value": "breakfast"}
 * conflictMarkerEnd": ">>>> ", "pullCommit": "./right.txt", "__conflict" : true},
 * ```
 *
 * The new - now valid JSON - gets parsed using JSON.parse again. The slots with conflict will be enriched in the corresponding slot entry objects.
 *
 * @param slotFileContent
 * @returns
 */
export async function parseSlotFile<DocType extends HasId>(slotFileContent: string) {
	let slotFileContentParsed: undefined | any
	const slotfileEntries = [] as (SlotEntry<DocType> | null)[]

	try {
		slotFileContentParsed = JSON.parse(slotFileContent)
	} catch (e) {
		// todo check for conflict marker "Unexpected token '<' ...."

		// handle conflict markers

		const regexConflictBegin = /^(<{3,}\s+)([^\n]+)$/gm
		const replacementBegin = '{ "conflictMarkerStart": "$1", "mineInfo": "$2", "mine": '

		const regexConflictSeparator = /(={3,})\n/gm
		const replacementMiddle = ' "conflictMarkerSeparator": "$1", "theirs": '

		const regexConflictEnd = /^(>{3,}\s+)([^\n]+)$/gm
		const replacementEnd = ' "conflictMarkerEnd": "$1", "pullCommit": "$2", "__conflict" : true}, '

		const conflictMarkersReplaced = slotFileContent
			.replace(regexConflictBegin, replacementBegin)
			.replace(regexConflictSeparator, replacementMiddle)
			.replace(regexConflictEnd, replacementEnd)

		slotFileContentParsed = JSON.parse(conflictMarkersReplaced)
	}

	// remove leading comma element
	slotFileContentParsed.splice(-1)

	const hashPromises = [] as Promise<any>[]

	for (const [slotIndex, recordOnSlot] of slotFileContentParsed.entries()) {
		if (recordOnSlot === 0) {
			// eslint-disable-next-line unicorn/no-null -- we use null markers in slot file - undefined wont work
			slotfileEntries.push(null)
			continue
		}

		if (recordOnSlot.__conflict) {
			const conflictingSlotEntry = {
				// we don't need to compute a new hash -> combination of mine and there allows us to check
				// if the file has changed with respect to this record
				slotEntryHash: recordOnSlot.theirs.hash + recordOnSlot.mine.hash,
				data: recordOnSlot.mine.data,
				hash: recordOnSlot.mine.hash,
				idHash: recordOnSlot.mine.idHash,
				index: slotIndex,

				mergeConflict: {
					// add metadata to be able to json stringify again
					conflictMarkerStart: recordOnSlot.conflictMarkerStart,
					conflictMarkerSeparator: recordOnSlot.conflictMarkerSeparator,
					conflictMarkerEnd: recordOnSlot.conflictMarkerEnd,
					mineInfo: recordOnSlot.mineInfo,
					theirsInfo: recordOnSlot.pullCommit,
					hash: recordOnSlot.theirs.hash,
					data: recordOnSlot.theirs.data,
					idHash: recordOnSlot.theirs.idHash,
				},
			}

			// NOTE: we only expect a conflict if both slots cary a value!
			// - is there a case where one of each can be null??
			slotfileEntries.push(conflictingSlotEntry)

			// hashPromises.push(addIdHash(conflictingSlotEntry, idHashFn))
		} else {
			// data hash and slotEntry hash are the same in case there is no conflict
			recordOnSlot.slotEntryHash = recordOnSlot.hash
			recordOnSlot.index = slotIndex
			//hashPromises.push(addIdHash(recordOnSlot, idHashFn))
			slotfileEntries.push(recordOnSlot)
		}
	}

	// NOTE: we await promise all instead of awaiting in a loop here to speed up parse
	await Promise.all(hashPromises)
	return slotfileEntries
}

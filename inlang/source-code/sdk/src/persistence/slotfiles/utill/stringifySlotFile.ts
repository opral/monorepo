import { hash } from "./hash.js"
import type { HasId } from "../types/HasId.js"
import type { SlotFile } from "../types/SlotFile.js"

export async function stringifySlotFile<DocType extends HasId>(
	slotFile: SlotFile<DocType>,
	slotCount: number
) {
	let slotFileContent = "[\n"
	for (let currentSlot = 0; currentSlot < slotCount; currentSlot += 1) {
		const slotfileEntry = slotFile.recordSlots[currentSlot]
		if (!slotfileEntry) {
			// NOTE: We use 0, instead of null, to save 3 characters per empty record
			slotFileContent += "0,"
		} else {
			const soltFileEntryString = JSON.stringify(slotfileEntry.data)
			const slotFileEntyHash = await hash(soltFileEntryString)

			const dataString =
				'{"hash":"' +
				slotFileEntyHash +
				'", "data": ' +
				soltFileEntryString +
				"},"

			const conflict = slotfileEntry.mergeConflict
			if (conflict) {
				slotFileContent += conflict.conflictMarkerStart + conflict.mineInfo + "\n"

				slotFileContent += dataString + "\n"

				const conflictDataString = JSON.stringify(conflict.data)
				const conflictHash = await hash(conflictDataString)

				if (conflict.hash !== conflictHash) {
					// conflicts are imutable - we shouldn't change it and the string should be the same
					throw new Error("conflict hash differs after stringify-parse roundtrip")
				}

				slotFileContent += conflict.conflictMarkerSeparator + "\n"

				const wrappedConflictDataString =
					'{"hash":"' +
					conflictHash +
					'", "data": ' +
					conflictDataString +
					"},"

				slotFileContent += wrappedConflictDataString + "\n"

				slotFileContent += conflict.conflictMarkerEnd + conflict.theirsInfo + "\n"

				conflict.mineInfo + "\n"
			} else {
				slotFileContent += dataString + "\n"
			}
		}

		slotFileContent += "\n\n\n\n"
	}
	slotFileContent += "null]"
	return slotFileContent
}

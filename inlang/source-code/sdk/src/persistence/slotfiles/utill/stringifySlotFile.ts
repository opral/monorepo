import { hashString } from "./hash.js"
import type { HasId } from "../types/HasId.js"
import type { SlotFile } from "../types/SlotFile.js"
import type { SlotEntry } from "../types/SlotEntry.js"

async function stringifySlot<DocType extends HasId>(
	slotfileEntry: SlotEntry<DocType> | null | undefined
) {
	if (!slotfileEntry) {
		// NOTE: We use 0, instead of null, to save 3 characters per empty record
		return "0,\n\n\n\n"
	} else {
		let slot = ""
		const soltFileEntryString = JSON.stringify(slotfileEntry.data)
		const slotFileEntyHash = await hashString(soltFileEntryString)

		const dataString = '{"hash":"' + slotFileEntyHash + '", "data": ' + soltFileEntryString + "},"

		const conflict = slotfileEntry.mergeConflict
		if (conflict) {
			slot += conflict.conflictMarkerStart + conflict.mineInfo + "\n"

			slot += dataString + "\n"

			const conflictDataString = JSON.stringify(conflict.data)
			const conflictHash = await hashString(conflictDataString)

			if (conflict.hash !== conflictHash) {
				// conflicts are imutable - we shouldn't change it and the string should be the same
				throw new Error("conflict hash differs after stringify-parse roundtrip")
			}

			slot += conflict.conflictMarkerSeparator + "\n"

			const wrappedConflictDataString =
				'{"hash":"' + conflictHash + '", "data": ' + conflictDataString + "},"

			slot += wrappedConflictDataString + "\n"

			slot += conflict.conflictMarkerEnd + conflict.theirsInfo + "\n"

			conflict.mineInfo + "\n"
		} else {
			slot += dataString + "\n"
		}
		slot += "\n\n\n\n"
		return slot
	}
}

export async function stringifySlotFile<DocType extends HasId>(
	slotFile: SlotFile<DocType>,
	slotCount: number
) {
	let slotFileContent = "[\n"

	const contentPromises: any[] = []

	for (let currentSlot = 0; currentSlot < slotCount; currentSlot += 1) {
		const slotfileEntry = slotFile.recordSlots[currentSlot]
		contentPromises.push(await stringifySlot(slotfileEntry))
	}

	slotFileContent += (await Promise.all(contentPromises)).join("")
	slotFileContent += "null]"
	return slotFileContent
}

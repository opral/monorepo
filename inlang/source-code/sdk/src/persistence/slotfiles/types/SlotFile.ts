import { type SlotEntry, type TransientSlotEntry } from "./SlotEntry.js"
import { type HasId } from "./HasId.js"

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

export type SlotFile<DocType extends HasId> = {
	exists: boolean
	contentHash: string | undefined
	recordSlots: (SlotEntry<DocType> | null)[]
}



export type TransientSlotFile<DocType extends HasId> = {
	exists: boolean
	contentHash: string | undefined
	recordSlots: (TransientSlotEntry<DocType> | null)[]
}


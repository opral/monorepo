import { type SlotEntry } from "./SlotEntry.js"
import { type HasId } from "./HasId.js"
import { type SlotFile } from "./SlotFile.js"

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

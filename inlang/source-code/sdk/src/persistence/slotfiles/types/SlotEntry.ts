import { type HasId } from "./HasId.js"

export type SlotEntry<DocType extends HasId> = {
	hash: string
	// a normalized object
	data: DocType
	index: number
	_deleted: boolean
	_writingFlag?: boolean
}

/**
reuse for conflict cases?
export type SlotEntryStates<DocType extends HasId> = {
	remoteState: SlotEntry<DocType> | undefined
	conflictState: SlotEntry<DocType> | undefined
	headState: SlotEntry<DocType> | undefined
	workingCopyState: SlotEntry<DocType> | undefined
	memoryOriginState: SlotEntry<DocType> | undefined
	memoryState: SlotEntry<DocType>
}


 */
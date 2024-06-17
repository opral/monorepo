import { type HasId } from "./HasId.js"

export type SlotEntry<DocType extends HasId> = {
	slotEntryHash: string
	hash: string
	// a normalized object
	data: DocType
	mergeConflict?: {
		conflictMarkerStart: string
		conflictMarkerSeparator: string
		conflictMarkerEnd: string
		mineInfo: string
		theirsInfo: string
		data: DocType
		hash: string
	}
	slotEntryIdHash: string
	index: number
	// NOTE: TBD deletion should be dealt with on application level i think?
	// _deleted: boolean
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

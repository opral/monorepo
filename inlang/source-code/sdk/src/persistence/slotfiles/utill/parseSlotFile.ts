export function parseSlotFile(slotFileContent: string) {
	let slotFileContentParsed: undefined | any
	try {
		slotFileContentParsed = JSON.parse(slotFileContent)
	} catch (e) {
		// todo check if unexpected token is a conflict marker

		const regexConflictBegin = /^(<{3,}\s+)([^\n]+)$/gm
		const replacementBegin = '{ "conflictMarkerStart": "$1", "mineInfo": "$2", "mine": '

		const regexConflictSeparator = /(={3,})\n/gm
		const replacementMiddle = ' "conflictMarkerMiddle": "$1", "theirs": '

		const regexConflictEnd = /^(>{3,}\s+)([^\n]+)$/gm
		const replacementEnd = ' "conflictMarkerStart": "$1", "pullCommit": "$2"}, '

		const conflictMarkersReplaced = slotFileContent
			.replace(regexConflictBegin, replacementBegin)
			.replace(regexConflictSeparator, replacementMiddle)
			.replace(regexConflictEnd, replacementEnd)

		slotFileContentParsed = JSON.parse(conflictMarkersReplaced)
	}

	// TODO handle conflict case where file is in conflict state and json is not valid
	/*
<<<< ./left.txt
{ state: b}
====
{ state: a }
>>>> ./right.txt

replace this to

{ "mine": (<<<< ./left.txt)

"theirs": (====)
"conflict": true}, >>>> ./right.txt
*/

	// remove leading comma element
	slotFileContentParsed.splice(-1)

	for (const [slotIndex, recordOnSlot] of slotFileContentParsed.entries()) {
		if (recordOnSlot) {
			recordOnSlot.index = slotIndex
		}
	}
	return slotFileContentParsed
}

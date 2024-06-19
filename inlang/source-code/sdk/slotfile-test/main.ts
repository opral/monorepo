/* eslint-disable no-console */
// eslint-disable-next-line no-restricted-imports
import * as readline from "node:readline"
import createSlotStorage from "../src/persistence/slotfiles/createSlotStorage.js"
import { randomHumanId } from "../src/storage/human-id/human-readable-id.js"
// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"

const filePath = process.argv[2]
if (!filePath) {
	throw new Error("expected path argument")
}

type SampleDoc = {
	id: string
	content: string
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const handleChanges = (eventName: string) => {
	// if (!connected) return
	// if (eventName === "record-change") {
	// 	console.log("Database changed - current objects:")
	// 	console.table(
	// 		storage.readAll().map((record) => ({
	// 			id: record.data.id,
	// 			data: record.data,
	// 			conflict: record.mergeConflict?.data,
	// 		}))
	// 	)
	// } else {
	// 	// console.table({
	// 	// 	slot1: { slotfile1: "slotfile1_slot1", slotfile2: "slotfile2_slot1" },
	// 	// 	slot2: { slotfile1: "slotfile1_slot2", slotfile2: "slotfile2_slot2" },
	// 	// })
	// 	const slotMatrix = {} as any
	// 	for (const slotFile of [...storage._internal.fileNamesToSlotfileStates.keys()].sort()) {
	// 		const currentSlotfile = storage._internal.fileNamesToSlotfileStates.get(slotFile)
	// 		let slotIndex = 0
	// 		for (const recordSlot of currentSlotfile!.memoryOriginState.recordSlots) {
	// 			if (!slotMatrix[slotIndex]) {
	// 				slotMatrix[slotIndex] = {} as any
	// 			}
	// 			slotMatrix[slotIndex][currentSlotfile!.slotFileName] = recordSlot
	// 				? recordSlot.data.id
	// 				: null
	// 			slotIndex++
	// 		}
	// 	}
	// 	console.log("Slot Matrix:")
	// 	console.table(slotMatrix)
	// }
	// console.table(storage._fileNamesToSlotfileStates)
}

const storage = createSlotStorage<SampleDoc>(16 * 16 * 16 * 16, handleChanges)
let connected = false
console.log("Connecting to file system....")

await storage.connect(fs, filePath)
connected = true
console.log("....Connecting to file system done")
console.log("Enter a command in the format: list | create <content> | update <id> <content>")

const list = () => {
	console.table(
		storage.readAll().map((record) => ({
			id: record.data.id,
			data: record.data,
			conflict: record.mergeConflict?.data,
		}))
	)
}

rl.on("line", (input: string) => {
	const [action, id, ...contentArr] = input.split(" ")

	if (action === "create") {
		if (id) {
			const content = [id, ...contentArr].join(" ")
			const recordId = randomHumanId()
			storage.insert({ id: recordId, content })
			console.log("created!")
			console.table(storage.findDocumentsById([recordId]))
			return
		}
	} else if (action === "update") {
		if (id) {
			const content = contentArr.join(" ")
			const existingDoc = storage.readAll().find((doc) => doc.data.id === id)
			if (!existingDoc) {
				console.log('document with id "' + id + '" doesnt exist')
				return
			}
			storage.update({ id, content })
			console.log("updated!")
			list()
		}
	} else if (action === "list") {
		list()
		return
	}
	console.log("Enter a command in the format: list | create <content> | update <id> <content>")
})

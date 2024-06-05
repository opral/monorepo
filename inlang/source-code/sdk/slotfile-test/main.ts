/* eslint-disable no-console */
// eslint-disable-next-line no-restricted-imports
import * as readline from "node:readline"
import createSlotStorage from "../src/persistence/slotfiles/slotfile.js"
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
	if (eventName === "record-change") {
		console.log("Database changed - current objects:")
		console.table(storage.readAll())
	} else {
		// console.table({
		// 	slot1: { slotfile1: "slotfile1_slot1", slotfile2: "slotfile2_slot1" },
		// 	slot2: { slotfile1: "slotfile1_slot2", slotfile2: "slotfile2_slot2" },
		// })

		const slotMatrix = {} as any
		for (const slotFile of [...storage._fileNamesToSlotfileStates.keys()].sort()) {
			const currentSlotfile = storage._fileNamesToSlotfileStates.get(slotFile)
			let slotIndex = 0
			for (const recordSlot of currentSlotfile!.memoryOriginState.recordSlots) {
				if (!slotMatrix[slotIndex]) {
					slotMatrix[slotIndex] = {} as any
				}

				slotMatrix[slotIndex][currentSlotfile!.slotFileName] = recordSlot
					? recordSlot.data.id
					: null
				slotIndex++
			}
		}

		console.log("Slot Matrix:")
		console.table(slotMatrix)
	}

	// console.table(storage._fileNamesToSlotfileStates)
}

const storage = createSlotStorage<SampleDoc>(fs, filePath, handleChanges)

storage.connect()
console.log("Enter a command in the format: create <content> | update <id> <content>")

rl.on("line", (input: string) => {
	const [action, id, ...contentArr] = input.split(" ")

	if (!id || (action !== "create" && action !== "update")) {
		console.log("Enter a command in the format: create <content> | update <id> <content>")
		return
	}

	if (action === "create") {
		const content = id + " " + contentArr.join(" ")
		storage.insert({ id: randomHumanId(), content })
	} else if (action === "update") {
		const content = contentArr.join(" ")
		const existingDoc = storage.readAll().find((doc) => doc.id === id)
		if (!existingDoc) {
			console.log('document with id "' + id + '" doesnt exist')
		}
		storage.update({ id, content })
	}
})

import { test, expect, describe, it } from "vitest"
import createSlotStorage from "./createSlotStorage.js"
import fs from "node:fs/promises"

type DocumentExample = {
	id: string
	content: string
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// TODO write test if new file gets created on collison
// TODO test that inserting the same item fails on memory
// TODO test that inserting the same item (id) fails between processes
// TODO test that data witten by another process reaches the process via fs events

describe("Disconnected slot storage", () => {
	it("insert should lead to a transient record", async () => {
		const slotStorage = createSlotStorage<DocumentExample>((event) => {
			console.log(event)
		})

		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}

		slotStorage.insert(insertedDocument)

		expect(slotStorage._internal.transientSlotEntries.size).eq(1)

		const docs1 = await slotStorage.findDocumentsById([insertedDocument.id])
		expect(docs1.length).eq(1)
		expect(Object.isFrozen(docs1[0])).eq(true, "Records returned by slotStorage should be frozen")
		expect(docs1[0]!.data.content).eq(insertedDocument.content)

		const updateDocument = structuredClone(insertedDocument)
		updateDocument.content = "updated"

		slotStorage.update(updateDocument)
		expect(slotStorage._internal.transientSlotEntries.size).eq(1)

		const docs2 = await slotStorage.findDocumentsById([updateDocument.id])
		expect(docs2.length).eq(1)
		expect(Object.isFrozen(docs2[0])).eq(true)
		expect(docs2[0]!.data.content).eq(updateDocument.content)
	})

	it("update on a non existing record should throw", async () => {
		const slotStorage = createSlotStorage<DocumentExample>(() => {
			console.log("test")
		})

		const nonExistingRecord: DocumentExample = {
			id: "1",
			content: "first document",
		}

		try {
			slotStorage.update(nonExistingRecord)
		} catch (e) {
			expect((e as Error).message).contain("does not exist")
		}
	})

	it("insert should lead to a transient record", async () => {
		const path = "./testslots/transientConnect/"
		try {
			await fs.rmdir(path, {
				recursive: true,
			})
		} catch (e) {}
		const slotStorage = createSlotStorage<DocumentExample>((event) => {
		})

		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}

		slotStorage.insert(insertedDocument)

		expect(slotStorage._internal.transientSlotEntries.size).eq(1)

		await slotStorage.connect(fs, path)
		expect(slotStorage._internal.transientSlotEntries.size).eq(0)
	})

	it("simultanous updates should lead to conflicts", async () => {
		const path = "./testslots/twoStorages/"
		try {
			await fs.rmdir(path, {
				recursive: true,
			})
		} catch (e) {}
		const slotStorage1 = createSlotStorage<DocumentExample>((event) => {
			
		})

		const slotStorage2 = createSlotStorage<DocumentExample>((event) => {
		})

		await slotStorage1.connect(fs, path)
		await slotStorage2.connect(fs, path)
		
		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}
		await slotStorage1.insert(insertedDocument)

		// let the file event reach slotStorage2
		await sleep(3000)

		console.log("storage11Result")
		console.log(slotStorage1.readAll())
		console.log("storage2Result")
		console.log(slotStorage2.readAll())

		expect(slotStorage2.readAll()).deep(slotStorage1.readAll())
		slotStorage2.disconnect()

		const updateInSlot1 = structuredClone(insertedDocument)
		updateInSlot1.content = "updated in slot1"
		slotStorage1.update(updateInSlot1)

		const updateInSlot2 = structuredClone(insertedDocument)
		updateInSlot2.content = "updated in slot2"
		slotStorage2.update(updateInSlot2)

		await slotStorage2.connect(fs, path)
		const conflictingRecord = slotStorage2.findDocumentsById([insertedDocument.id])[0]
		expect(conflictingRecord?.localConflict).not.eq(undefined)
	})
})

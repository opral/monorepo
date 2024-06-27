import { expect, describe, it } from "vitest"
import createSlotStorage from "./createSlotStorage.js"
import fs from "node:fs/promises"

type DocumentExample = {
	id: string
	content: string
}

// TODO write test if new file gets created on collison
// TODO test that inserting the same item fails on memory
// TODO test that inserting the same item (id) fails between processes
// TODO test that data witten by another process reaches the process via fs events

describe("Disconnected slot storage", () => {
	it("insert should lead to a transient record", async () => {
		// const slotStorage = createSlotStorage<DocumentExample>("storage-1", 16, 3)
		// const insertedDocument: DocumentExample = {
		// 	id: "1",
		// 	content: "first document",
		// }
		// await slotStorage.insert(insertedDocument, false)
		// expect(slotStorage._internal.transientSlotEntries.size).eq(1)
		// const docs1 = await slotStorage.findDocumentsById([insertedDocument.id])
		// expect(docs1.length).eq(1)
		// // expect(Object.isFrozen(docs1[0])).eq(true, "Records returned by slotStorage should be frozen")
		// // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check the length before
		// expect(docs1[0]!.data.content).eq(insertedDocument.content)
		// const updateDocument = structuredClone(insertedDocument)
		// updateDocument.content = "updated"
		// slotStorage.update(updateDocument)
		// expect(slotStorage._internal.transientSlotEntries.size).eq(1)
		// const docs2 = await slotStorage.findDocumentsById([updateDocument.id])
		// expect(docs2.length).eq(1)
		// expect(Object.isFrozen(docs2[0])).eq(true)
		// expect(docs2[0]!.data.content).eq(updateDocument.content)
	})

	it("update on a non existing record should throw", async () => {
		// const slotStorage = createSlotStorage<DocumentExample>("storage-2", 16, 3)
		// const nonExistingRecord: DocumentExample = {
		// 	id: "1",
		// 	content: "first document",
		// }
		// try {
		// 	await slotStorage.update(nonExistingRecord)
		// } catch (e) {
		// 	expect((e as Error).message).contain("does not exist")
		// }
	})

	it("insert should lead to a transient record", async () => {
		const path = "./testslots/transientConnect/"
		try {
			await fs.rmdir(path, {
				recursive: true,
			})
		} catch (e) {
			/* empty */
		}
		// TODO implement without connect / disconnect
		// const slotStorage = createSlotStorage<DocumentExample>("storage-3", 16, 3)

		// const insertedDocument: DocumentExample = {
		// 	id: "1",
		// 	content: "first document",
		// }

		// await slotStorage.insert(insertedDocument, false)

		// expect(slotStorage._internal.transientSlotEntries.size).eq(1)

		// await slotStorage.connect(fs, path)
		// expect(slotStorage._internal.transientSlotEntries.size).eq(0)
	})

	it("simultanous updates should lead to a local conflict", async () => {
		const path = "./testslots/twoStorages/"
		try {
			await fs.rmdir(path, {
				recursive: true,
			})
		} catch (e) {
			// console.log(e)
			/* empty */
		}
		// TODO implement without connect / disconnect
		// const slotStorage1 = createSlotStorage<DocumentExample>("storage-4", 16, 3)

		// const slotStorage2 = createSlotStorage<DocumentExample>("storage-5", 16, 3)

		// await slotStorage1.connect(fs, path)
		// await slotStorage2.connect(fs, path)

		// const insertedDocument: DocumentExample = {
		// 	id: "1",
		// 	content: "first document",
		// }
		// await slotStorage1.insert(insertedDocument, false)
		// expect(slotStorage1._internal.transientSlotEntries.size).eq(1)
		// await slotStorage1.save()
		// expect(slotStorage1._internal.transientSlotEntries.size).eq(0)

		// // force reload to avoid waiting for fs event
		// await slotStorage2.loadSlotFilesFromWorkingCopy(true)

		// const currentDocumentsStorage1 = await slotStorage1.readAll()
		// const currentDocumentsStorage2 = await slotStorage2.readAll()

		// expect(currentDocumentsStorage1).deep.eq(currentDocumentsStorage2)
		// slotStorage2.disconnect()

		// const updateInSlot1 = structuredClone(insertedDocument)
		// updateInSlot1.content = "updated in slot1"
		// await slotStorage1.update(updateInSlot1)

		// const updateInSlot2 = structuredClone(insertedDocument)
		// updateInSlot2.content = "updated in slot2"
		// await slotStorage2.update(updateInSlot2)

		// await slotStorage2.connect(fs, path)
		// const conflictingRecord = slotStorage2.findDocumentsById([insertedDocument.id])[0]

		// expect(conflictingRecord?.localConflict).not.eq(undefined)
	}, 200000)
})

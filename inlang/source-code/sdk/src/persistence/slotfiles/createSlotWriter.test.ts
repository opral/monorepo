import { expect, describe, it } from "vitest"
import createSlotWriter from "./createSlotWriter.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

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
		const memoryFs = createNodeishMemoryFs()

		const slotStorage = await createSlotWriter<DocumentExample>({
			fs: memoryFs,
			path: "/slot/",
			fileNameCharacters: 3,
			slotsPerFile: 16,
			watch: false,
		})
		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}
		await slotStorage.insert({
			document: insertedDocument,
			saveToDisk: false,
		})

		expect(slotStorage._writerInternals.transientSlotEntries.size).eq(1)
		const docs1 = await slotStorage.findByIds([insertedDocument.id])
		expect(docs1.length).eq(1)
		// expect(Object.isFrozen(docs1[0])).eq(true, "Records returned by slotStorage should be frozen")
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check the length before
		expect(docs1[0]!.data.content).eq(insertedDocument.content)
		const updateDocument = structuredClone(insertedDocument)
		updateDocument.content = "updated"

		await slotStorage.update({ document: updateDocument, saveToDisk: false })
		expect(slotStorage._writerInternals.transientSlotEntries.size).eq(1)
		const docs2 = await slotStorage.findByIds([updateDocument.id])
		expect(docs2.length).eq(1)
		expect(docs2[0]!.data.content).eq(updateDocument.content)
	})

	it("update on a non existing record should throw", async () => {
		const memoryFs = createNodeishMemoryFs()
		const slotStorage = await createSlotWriter<DocumentExample>({
			fs: memoryFs,
			path: "/slot/",
			fileNameCharacters: 3,
			slotsPerFile: 16,
			watch: false,
		})
		const nonExistingRecord: DocumentExample = {
			id: "1",
			content: "first document",
		}
		try {
			await slotStorage.update({ document: nonExistingRecord })
		} catch (e) {
			expect((e as Error).message).contain("does not exist")
		}
	})

	it("insert should lead to a transient record save should lead to a record in non transient state", async () => {
		const memoryFs = createNodeishMemoryFs()
		const slotStorage = await createSlotWriter<DocumentExample>({
			fs: memoryFs,
			path: "/slot/",
			fileNameCharacters: 3,
			slotsPerFile: 16,
			watch: false,
		})

		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}

		await slotStorage.insert({ document: insertedDocument, saveToDisk: false })

		expect(slotStorage._writerInternals.transientSlotEntries.size).eq(1)

		await slotStorage.save()
		expect(slotStorage._writerInternals.transientSlotEntries.size).eq(0)
		const docs1 = await slotStorage.findByIds([insertedDocument.id])
		expect(docs1.length).eq(1)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check the length before
		expect(docs1[0]!.data.content).eq(insertedDocument.content)
	})

	it("simultanous updates should lead to a local conflict", async () => {
		const memoryFs = createNodeishMemoryFs()
		const slotStorage1 = await createSlotWriter<DocumentExample>({
			fs: memoryFs,
			path: "/slot/",
			fileNameCharacters: 3,
			slotsPerFile: 16,
			watch: false,
		})

		const slotStorage2 = await createSlotWriter<DocumentExample>({
			fs: memoryFs,
			path: "/slot/",
			fileNameCharacters: 3,
			slotsPerFile: 16,
			watch: false,
		})

		const insertedDocument: DocumentExample = {
			id: "1",
			content: "first document",
		}
		await slotStorage1.insert({ document: insertedDocument, saveToDisk: false })
		expect(slotStorage1._writerInternals.transientSlotEntries.size).eq(1)
		await slotStorage1.save()
		expect(slotStorage1._writerInternals.transientSlotEntries.size).eq(0)

		// force reload to avoid waiting for fs event
		await slotStorage2.loadSlotFilesFromWorkingCopy({ forceReload: true })

		const currentDocumentsStorage1 = await slotStorage1.readAll()
		const currentDocumentsStorage2 = await slotStorage2.readAll()

		expect(currentDocumentsStorage1).deep.eq(currentDocumentsStorage2)
		// slotStorage2.disconnect()

		const updateInSlot1 = structuredClone(insertedDocument)
		updateInSlot1.content = "updated in slot1"
		await slotStorage1.update({ document: updateInSlot1, saveToDisk: false })

		const updateInSlot2 = structuredClone(insertedDocument)
		updateInSlot2.content = "updated in slot2"
		await slotStorage2.update({ document: updateInSlot2, saveToDisk: false })

		await slotStorage1.save()
		await slotStorage2.save()
		const conflictingRecord = slotStorage2.findByIds([insertedDocument.id])[0]

		expect(conflictingRecord?.localConflict).not.eq(undefined)
	}, 200000)
})

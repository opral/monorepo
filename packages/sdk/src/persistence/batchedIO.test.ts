import { describe, it, expect, vi } from "vitest"
import { sleep } from "../test-utilities/sleep.js"
import { batchedIO } from "./batchedIO.js"

let locked = false

const instrumentAquireLockStart = vi.fn()

async function mockAquireLock() {
	instrumentAquireLockStart()
	let pollCount = 0
	while (locked && pollCount++ < 100) {
		await sleep(10)
	}
	if (locked) {
		throw new Error("Timeout acquiring lock")
	}
	await sleep(10)
	locked = true
	return 69
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mockReleaseLock(_: number) {
	sleep(10)
	locked = false
}

const instrumentSaveStart = vi.fn()
const instrumentSaveEnd = vi.fn()

async function mockSave() {
	instrumentSaveStart()
	await sleep(50)
	instrumentSaveEnd()
}

describe("batchedIO", () => {
	it("queues 2 requests while waiting for lock and pushes 2 more to the next batch", async () => {
		const save = batchedIO(mockAquireLock, mockReleaseLock, mockSave)
		const p1 = save("1")
		const p2 = save("2")
		await sleep(5)
		expect(instrumentAquireLockStart).toHaveBeenCalledTimes(1)
		expect(instrumentSaveStart).not.toHaveBeenCalled()
		await sleep(10)
		expect(instrumentSaveStart).toHaveBeenCalled()
		expect(instrumentSaveEnd).not.toHaveBeenCalled()
		const p3 = save("3")
		const p4 = save("4")
		expect(instrumentAquireLockStart).toHaveBeenCalledTimes(2)
		expect(locked).toBe(true)
		await sleep(50)
		expect(instrumentSaveEnd).toHaveBeenCalled()
		expect(await p1).toBe("1")
		expect(await p2).toBe("2")
		expect(instrumentSaveStart).toHaveBeenCalledTimes(1)
		expect(await p3).toBe("3")
		expect(await p4).toBe("4")
		expect(instrumentAquireLockStart).toHaveBeenCalledTimes(2)
		expect(instrumentSaveStart).toHaveBeenCalledTimes(2)
	})
})

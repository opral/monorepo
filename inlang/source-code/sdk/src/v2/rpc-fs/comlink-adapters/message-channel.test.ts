import { describe, it, expect } from "vitest"
import { StructuredCloneAdapter } from "./structured-clone-adapter.js"
import * as Comlink from "comlink"
import { asyncIterableTransferHandler } from "../transfer/asyncIterable.js"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)

describe("message-channel adapter", () => {
	it("works", async () => {
		const { port1, port2 } = StructuredCloneChannel()

		const obj = {
			eepy: sleepyGenerator,
		} as const

		Comlink.expose(obj, StructuredCloneAdapter(port1))
		const proxied = Comlink.wrap<typeof obj>(StructuredCloneAdapter(port2))

		const result = []
		for await (const i of await proxied.eepy(4)) {
			result.push(i)
		}
		expect(result).toEqual([0, 1, 2, 3])
	})
})

async function* sleepyGenerator(num: number) {
	for (let i = 0; i < num; i++) {
		await new Promise((resolve) => setTimeout(resolve, 10))
		yield i
	}
}

/**
 * Creates a message channel that does not support transfer values, only stringified messages
 */
function StructuredCloneChannel(): MessageChannel {
	const { port1, port2 } = new MessageChannel()

	const wrappedP1 = {
		addEventListener: port1.addEventListener.bind(port1),
		removeEventListener: port1.removeEventListener.bind(port1),
		postMessage(message: any) {
			port1.postMessage(message)
		},
	} as MessagePort

	const wrappedP2 = {
		addEventListener: port2.addEventListener.bind(port2),
		removeEventListener: port2.removeEventListener.bind(port2),
		postMessage(message: any) {
			port2.postMessage(message)
		},
	} as MessagePort

	return { port1: wrappedP1, port2: wrappedP2 }
}

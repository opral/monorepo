import { describe, it, expect } from "vitest"
import * as Comlink from "comlink"

describe("message-channel adapter", () => {
	it("works", async () => {
		const { port1, port2 } = new MessageChannel()

		const wrappedP1 = {
			addEventListener: port1.addEventListener.bind(port1),
			removeEventListener: port1.removeEventListener.bind(port1),
			postMessage(message: any, transfer) {
				console.log("postMessage", message, transfer)
				port1.postMessage(message)
			},
		}

		const wrappedP2 = {
			addEventListener: port2.addEventListener.bind(port2),
			removeEventListener: port2.removeEventListener.bind(port2),
			postMessage(message: any, transfer) {
				console.log("postMessage", message, transfer)
				port2.postMessage(message)
			},
		}

		const obj = {
			helloWorld: () => Comlink.proxy(() => "Hello World!"),
		} as const

		Comlink.expose(obj, wrappedP1)

		const proxied = Comlink.wrap<typeof obj>(wrappedP2)
		const val = await proxied.helloWorld()
		expect(await val()).toBe("Hello World!")
	})
})

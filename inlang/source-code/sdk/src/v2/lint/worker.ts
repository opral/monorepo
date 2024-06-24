import type { MessageToWorker } from "./worker-interface.js"

self.addEventListener("message", (e: MessageEvent<MessageToWorker>) => {
	switch (e.data.type) {
		case "init": {
			console.info("init", e.data)
			break
		}
		case "invalidate": {
			console.info("invalidated", e.data)
			break
		}
		default: {
			throw new Error(`unknown message: ${e.data}`)
		}
	}
})

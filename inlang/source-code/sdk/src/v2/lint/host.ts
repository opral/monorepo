import type { MessageFromWorker, MessageToWorker } from "./worker-interface.js"

export function createLintReportQuery(lintRules: string[]) {
	const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })

	const initMessage: Extract<MessageToWorker, { type: "init" }> = {
		type: "init",
		lintRules,
	}

	worker.postMessage(initMessage)
	worker.addEventListener("message", (e: MessageEvent<MessageFromWorker>) => {
		switch (e.data.type) {
			case "rpc-request:readFile": {
				console.log(e.data)
				break
			}
			default: {
				throw new Error(`unknown message: ${e.data}`)
			}
		}
	})
}

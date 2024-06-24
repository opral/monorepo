export type MessageToWorker =
	| {
			type: "invalidate"
	  }
	| {
			type: "init"
			lintRules: string[]
	  }
	| {
			type: "rpc-reply:readFile"
			content: string | ArrayBuffer
			rpcId: string
	  }

export type MessageFromWorker = {
	type: "rpc-request:readFile"
	path: string
	encoding: "utf-8" | "binary"
	rpcId: string
}

import * as Comlink from "comlink"

type InitialProps =
	| {
			aborted: true
			reason: any
	  }
	| {
			aborted: false
			reason: undefined
	  }

type Serailized = [MessagePort, InitialProps]

const abortSignalTransferHandler: Comlink.TransferHandler<AbortSignal, Serailized> = {
	canHandle: (obj): obj is AbortSignal => obj instanceof AbortSignal,
	serialize(signal) {
		console.log("serializing", signal)
		const { port1, port2 } = new MessageChannel()

		const initialProps = {
			aborted: signal.aborted,
			reason: signal.reason,
		}

		signal.onabort = () => port1.postMessage("abort")

		const serialized: Serailized = [port2, initialProps]
		return [serialized, [port2]]
	},
	deserialize: ([port, initialProps]) => {
		const ac = new AbortController()
		if (initialProps.aborted) ac.abort(initialProps.reason)
		port.onmessage = () => ac.abort()
		return ac.signal
	},
}

export { abortSignalTransferHandler }

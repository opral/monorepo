import * as Comlink from "comlink"

type WatchOptions = {
	signal?: AbortSignal
	recursive?: boolean
}

type InitialAbortSignalProps =
	| {
			aborted: true
			reason: any
	  }
	| {
			aborted: false
			reason: undefined
	  }

type SerializedSignal = [MessagePort, InitialAbortSignalProps]
type Serailized = {
	recursive: boolean | undefined
	signal: SerializedSignal | undefined
}

const watchOptionsTransferHandler: Comlink.TransferHandler<WatchOptions, Serailized> = {
	canHandle: isWatchOptions,
	serialize(watchOptions) {
		const signalTransfer = watchOptions.signal ? transferSignal(watchOptions.signal) : undefined

		const serialized: Serailized = {
			recursive: watchOptions.recursive,
			signal: signalTransfer ? signalTransfer[0] : undefined,
		}

		return [serialized, signalTransfer ? [signalTransfer[1]] : []]
	},
	deserialize: (serialized) => {
		let signal: AbortSignal | undefined = undefined
		if (serialized.signal) {
			const port = serialized.signal[0]
			const initialProps = serialized.signal[1]

			const ac = new AbortController()
			if (initialProps.aborted) ac.abort(initialProps.reason)
			port.onmessage = (ev) => ac.abort(ev.data)
			signal = ac.signal
		}

		const options: WatchOptions = {
			recursive: serialized.recursive,
			signal,
		}

		return options
	},
}

export { watchOptionsTransferHandler }

/**
 * Checks that the object is watchOptions **and** it has a signal
 * @param obj
 * @returns
 */
function isWatchOptions(obj: unknown): obj is WatchOptions {
	if (!obj) return false
	if (typeof obj !== "object") return false

	const allowedKeys = ["signal", "recursive", "persistent"]

	if (!("signal" in obj) || !(obj["signal"] instanceof AbortSignal)) return false
	if ("recursive" in obj && typeof obj["recursive"] !== "boolean") return false
	if ("persistent" in obj && typeof obj["persistent"] !== "boolean") return false

	for (const key in obj) {
		if (!allowedKeys.includes(key)) return false
	}
	return true
}

function transferSignal(signal: AbortSignal): [SerializedSignal, MessagePort] {
	const { port1, port2 } = new MessageChannel()

	const initialProps = {
		aborted: signal.aborted,
		reason: signal.reason,
	}

	signal.onabort = () => port1.postMessage(signal.reason)
	const serialized: SerializedSignal = [port2, initialProps]
	return [serialized, port2]
}

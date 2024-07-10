import * as Comlink from "comlink"

/**
 * A comlink Endpoint that does NOT support transfers on `postMessage`
 */
export interface StructuredCloneMessageChannel extends Comlink.Endpoint {
	postMessage(data: any): void
}

interface Message {
	/**
	 * The id of the messsage-channel to use
	 */
	id: string

	/**
	 * The stringified message
	 */
	msg: any

	/**
	 * An array of paths pointing to message ports
	 */
	messageChannels: string[][]
}

function wrap(smc: StructuredCloneMessageChannel, id: string | undefined = undefined): MessagePort {
	const { port1, port2 } = new MessageChannel()
	hookup(port2, smc, id)
	return port1
}

function hookup(
	internalPort: MessagePort,
	smc: StructuredCloneMessageChannel,
	id: string | undefined = undefined
): void {
	internalPort.onmessage = (event: MessageEvent<Message>) => {
		if (!id) id = generateUUID()
		const msg = event.data
		const messageChannels = [...findMessagePorts(event.data)]
		for (const messageChannel of messageChannels) {
			const id = generateUUID()
			const channel = replaceProperty(msg, messageChannel, id)
			hookup(channel, smc, id)
		}
		const payload: Message = { id, msg, messageChannels }
		smc.postMessage(payload)
	}

	smc.addEventListener("message", (event: Event) => {
		if (!(event instanceof MessageEvent)) return

		const data = event.data as Message
		if (!id) id = data.id
		if (id !== data.id) return

		const mcs = data.messageChannels.map((messageChannel) => {
			const id = messageChannel.reduce((obj, key) => obj[key], data.msg)
			const port = wrap(smc, id)

			replaceProperty(data.msg, messageChannel, port)
			return port
		})

		internalPort.postMessage(data.msg, mcs)
	})
}

/**
 * Replaces a property at a given path
 * @param obj The object
 * @param path The path to the property
 * @param newVal The value to set it to
 * @returns The original value at that path
 */
function replaceProperty(obj: any, path: string[], newVal: any): any {
	for (const key of path.slice(0, -1)) obj = obj[key]
	const key = path.at(-1) as keyof typeof obj
	const orig = obj[key]
	obj[key] = newVal
	return orig
}

/**
 * Recursively iterates through an object to find the Message Ports
 *
 * @param obj The thing to iterate through
 * @param path The path to the current object
 *
 * @returns The paths to the message ports
 */
function* findMessagePorts(obj: unknown, path: string[] = []): Iterable<string[]> {
	if (!obj) return
	if (typeof obj === "string") return
	if (obj instanceof MessagePort) {
		// make a copy of the current path, as it mutates while being walked
		yield [...path]
		return
	}
	for (const [key, value] of Object.entries(obj)) {
		path.push(key)
		yield* findMessagePorts(value, path)
		path.pop()
	}
}

function generateUUID(): string {
	return new Array(4)
		.fill(0)
		.map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
		.join("-")
}

/**
 * Wrap a substructural endpoint that does not support `postMessage` (like the one in VsCode)
 * and allow it to at least transfer `MessagePorts`
 */
export function StructuredCloneAdapter(smc: StructuredCloneMessageChannel) {
	return wrap(smc)
}

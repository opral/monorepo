import * as Comlink from "comlink"

type StructuredCloneEndpoint = Omit<Comlink.Endpoint, "postMessage"> & {
	postMessage(message: any): void
}

type EventListenerOrEventListenerObject = EventListener | EventListenerObject

const portMessageSymbol = Symbol("inlang.sdk.rpc-fs.port-message")
const comlinkMessageSymbol = Symbol("inlang.sdk.rpc-fs.comlink-message")
const messagePortSymbol = Symbol("MessagePort")

type SerializedMessagePort = {
	[messagePortSymbol]: true
	id: string
}

const isSerializedMessagePort = (thing: unknown): thing is SerializedMessagePort =>
	!!thing && typeof thing === "object" && messagePortSymbol in thing

type PortMessage = {
	[portMessageSymbol]: true
	portId: string
	value: any
}
const isPortMessage = (thing: unknown): thing is PortMessage =>
	!!thing && typeof thing === "object" && portMessageSymbol in thing

type ComlinkMessage = {
	[comlinkMessageSymbol]: true
	value: any
}

const isComlinkMessage = (thing: unknown): thing is ComlinkMessage =>
	!!thing && typeof thing === "object" && comlinkMessageSymbol in thing

const raiseUnserializeableError = () => {
	throw new TypeError("Unserializable return value")
}

/**
 * Wraps a comlink endpoint that does not support `transferables` on `postMessage` &
 * allows it to at least transfer MessagePorts
 */
export const StructuredCloneAdapter = (ep: Comlink.Endpoint): Comlink.Endpoint => {
	const proxiedPorts = new Map<string, MessagePort>()
	const portIds = new Map<MessagePort, string>()

	return {
		postMessage(message, transfer) {
			if (transfer) {
				const ports = transfer.filter(isMessagePort)
				const allArePorts = ports.length === transfer.length
				if (!allArePorts)
					throw new Error(
						"A StructuredCloneAdapter can only `transfer` MessagePorts via postMessage"
					)

				// proxy the ports
				for (const port of ports) {
					const id = generateUUID()
					proxiedPorts.set(id, port)
					portIds.set(port, id)
				}

				// replace all the ports in the message with their serialized counterparts

				if (Array.isArray(message)) {
					message = message.map((m) => {
						if (m instanceof MessagePort) {
							const id = portIds.get(m)
							if (!id) raiseUnserializeableError()
							return { [messagePortSymbol]: true, id }
						}
						return m
					})
				} else if (message instanceof MessagePort) {
					const id = portIds.get(message)
					if (!id) raiseUnserializeableError()
					message = { [messagePortSymbol]: true, id }
				}
			}

			const comlinkMesage: ComlinkMessage = {
				[comlinkMessageSymbol]: true,
				value: message,
			}

			ep.postMessage(comlinkMesage)
		},

		addEventListener(type, listener) {
			ep.addEventListener("message", (ev: MessageEvent<PortMessage | ComlinkMessage>) => {
				const data = ev.data
			})
		},

		removeEventListener(type, listener) {
			ep.removeEventListener(type, listener)
		},
		start: ep.start,
	}
}

function isMessagePort(thing: unknown): thing is MessagePort {
	return thing instanceof MessagePort
}

const wrap = (smc: StructuredCloneEndpoint, id: string | undefined = undefined): MessagePort => {
	const { port1, port2 } = new MessageChannel()
	hookup(port2, smc, id)
	return port1
}

function hookup(
	/**
	 * The port that get's exposed publicly
	 */
	internalPort: MessagePort,

	/**
	 * The postmessage channel to
	 */
	sce: StructuredCloneEndpoint,

	/**
	 * A unique identifier for this MessageChannel
	 */
	id: string | undefined = undefined
): void {
	internalPort.onmessage = (event: MessageEvent<Message>) => {
		if (!id) id = generateUID()
		const msg = event.data
		const messageChannels = [...findMessageChannels(event.data)]
		for (const messageChannel of messageChannels) {
			const id = generateUID()
			const channel = replaceProperty(msg, messageChannel, id)
			hookup(channel, sce, id)
		}
		sce.postMessage({ id, msg, messageChannels })
	}

	sce.addEventListener("message", (event) => {
		const data = event.data as Message
		if (!id) id = data.id
		if (id !== data.id) return

		const mcs = data.messageChannels.map((messageChannel) => {
			const id = messageChannel.reduce((obj, key) => obj[key], data.msg)
			const port = wrap(sce, id)
			replaceProperty(data.msg, messageChannel, port)
			return port
		})

		internalPort.postMessage(data.msg, mcs)
	})
}

function replaceProperty(obj: any, path: string[], newVal: any): any {
	for (const key of path.slice(0, -1)) obj = obj[key]
	const key = path.at(-1)
	const orig = obj[key]
	obj[key] = newVal
	return orig
}

function* findMessageChannels(obj: any, path: string[] = []): Iterable<string[]> {
	if (!obj) return
	if (typeof obj === "string") return
	if (obj instanceof MessagePort) {
		yield [...path]
		return
	}
	for (const key of Object.keys(obj)) {
		path.push(key)
		yield* findMessageChannels(obj[key], path)
		path.pop()
	}
}

function hex4(): string {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.slice(1)
}

const bits = 128
function generateUID(): string {
	return new Array(bits / 16).fill(0).map(hex4).join("")
}

function generateUUID(): string {
	return new Array(4)
		.fill(0)
		.map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
		.join("-")
}

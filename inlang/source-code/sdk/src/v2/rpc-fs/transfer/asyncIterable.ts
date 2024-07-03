import type * as Comlink from "comlink"

const MESSAGE_TYPES = { NEXT: 0, RETURN: 1, THROW: 2 }

type Result<T, E> =
	| {
			ok: true
			data: T
	  }
	| {
			ok: false
			error: E
	  }

function safe<AsyncFn extends (...args: any[]) => Promise<any>>(afn: AsyncFn) {
	return async (...args: Parameters<AsyncFn>): Promise<Result<ReturnType<AsyncFn>, unknown>> => {
		try {
			const iterable = await afn(...args)
			return { ok: true, data: iterable }
		} catch (error) {
			return { ok: false, error }
		}
	}
}

type NextValueResult = Result<IteratorResult<any>, unknown>

const listen = async (iterator: AsyncIterator<any>, port: MessagePort) => {
	port.onmessage = async (ev) => {
		const {
			data: { type, value },
		} = ev
		switch (type) {
			case MESSAGE_TYPES.NEXT: {
				const nextResult = await safe(iterator.next.bind(iterator))()
				port.postMessage(nextResult)
				break
			}
			case MESSAGE_TYPES.RETURN: {
				if (!iterator.return) throw new Error("Iterator does not support return")
				const returnResult = await safe(iterator.return.bind(iterator))(value)
				port.postMessage(returnResult)
				break
			}
			case MESSAGE_TYPES.THROW: {
				if (!iterator.throw) throw new Error("Iterator does not support throw")
				const throwResult = await safe(iterator.throw.bind(iterator))(value)
				port.postMessage(throwResult)
				break
			}
			default:
				throw new Error("Error while listening", { cause: ev })
		}
	}
}

type AvailableIteratorFunctions = { throw: boolean; return: boolean }
type Serialized = [MessagePort, AvailableIteratorFunctions]

const asyncIterableTransferHandler: Comlink.TransferHandler<AsyncIterable<any>, Serialized> = {
	canHandle: (obj: unknown): obj is AsyncIterable<any> => {
		return !!obj && typeof obj === "object" && Symbol.asyncIterator in obj
	},
	serialize: (iterable) => {
		const { port1, port2 } = new MessageChannel()
		const iterator = iterable[Symbol.asyncIterator]()

		const definedOptionalIteratorFns = {
			throw: "throw" in iterator,
			return: "return" in iterator,
		}

		listen(iterator, port1)
		const serialized: Serialized = [port2, definedOptionalIteratorFns]
		return [serialized, [port2]]
	},
	deserialize: ([port, availableIteratorFns]) => {
		const nextPortMessage = (): Promise<NextValueResult> =>
			new Promise((resolve) => {
				port.onmessage = ({ data }) => {
					resolve(data)
				}
			})

		// Cover the case where a user wants to be able to manually call the iterator methods
		const iterator: AsyncIterator<any> = {
			next: async (value) => {
				port.postMessage({ type: MESSAGE_TYPES.NEXT, value })
				const result = await nextPortMessage()
				if (result.ok) return result.data
				else throw result.error
			},

			// return and throw functions are optional (https://tc39.es/ecma262/#table-async-iterator-optional),
			// so we check if we need them before adding them
			return: availableIteratorFns.return
				? async (value) => {
						port.postMessage({ type: MESSAGE_TYPES.RETURN, value })
						const result = await nextPortMessage()
						if (result.ok) return result.data
						else throw result.error
				  }
				: undefined,

			throw: availableIteratorFns.throw
				? async (value) => {
						port.postMessage({ type: MESSAGE_TYPES.THROW, value })
						const result = await nextPortMessage()
						if (result.ok) return result.data
						else throw result.error
				  }
				: undefined,
		}

		const iterable = {
			[Symbol.asyncIterator]: () => iterator,
		}

		return iterable
	},
}

export { asyncIterableTransferHandler }

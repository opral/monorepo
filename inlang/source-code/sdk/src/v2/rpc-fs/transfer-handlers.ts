// @ts-nocheck
import type * as Comlink from "comlink"

const MESSAGE_TYPES = {
	NEXT: 0,
	RETURN: 1,
	THROW: 2,
}

type Result<T, E> =
	| {
			ok: true
			data: T
	  }
	| {
			ok: false
			error: E
	  }

async function next(iterator: AsyncIterator<any>): Promise<Result<IteratorResult<any>, unknown>> {
	try {
		const data = await iterator.next()
		return { ok: true, data }
	} catch (error) {
		return { ok: false, error }
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
				const nextResult = await next(iterator)
				port.postMessage(nextResult)
				break
			}
			case MESSAGE_TYPES.RETURN: {
				const returnValue = await iterator.return(value)
				port.postMessage({ ok: true, value: returnValue })
				break
			}
			case MESSAGE_TYPES.THROW: {
				const throwValue = await iterator.throw(value)
				port.postMessage({ ok: true, value: throwValue })
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
	canHandle: (obj): obj is AsyncIterable<any> => {
		return obj && obj[Symbol.asyncIterator]
	},
	serialize: (iterable) => {
		const { port1, port2 } = new MessageChannel("")
		const iterator = iterable[Symbol.asyncIterator]()

		const definedOptionalIteratorFns = {
			throw: !!iterator.throw,
			return: !!iterator.return,
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
		}

		// return and throw functions are optional (https://tc39.es/ecma262/#table-async-iterator-optional),
		// so we check they're available
		if (availableIteratorFns.return) {
			iterator.return = async (value) => {
				port.postMessage({ type: MESSAGE_TYPES.RETURN, value })
				const result = await nextPortMessage()
				if (result.ok) return result.data
				else throw result.error
			}
		}

		if (availableIteratorFns.throw) {
			iterator.throw = async (value) => {
				port.postMessage({ type: MESSAGE_TYPES.THROW, value })
				const result = await nextPortMessage()
				if (result.ok) return result.data
				else throw result.error
			}
		}

		// Make it iterable so it can be used in for-await-of statement
		iterator[Symbol.asyncIterator] = () => iterator
		return iterator
	},
}

export { asyncIterableTransferHandler }

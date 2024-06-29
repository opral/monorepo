// @ts-nocheck

const MESSAGE_TYPES = {
	NEXT: "NEXT",
	RETURN: "RETURN",
	THROW: "THROW",
	DEFINED_OPTIONAL_ITERATOR_FNS: "DEFINED_OPTIONAL_ITERATOR_FNS",
}

const listen = async (iterator, port) => {
	port.onmessage = async ({ data: { type, value } }) => {
		switch (type) {
			case MESSAGE_TYPES.NEXT:
				port.postMessage(await iterator.next(value))
				break
			case MESSAGE_TYPES.RETURN:
				port.postMessage(await iterator.return(value))
				break
			case MESSAGE_TYPES.THROW:
				port.postMessage(await iterator.throw(value))
		}
	}
}

const makeTransferHandler = (symbolLookup) => ({
	canHandle: (obj) => {
		return obj && obj[symbolLookup]
	},
	serialize: (iterable) => {
		const { port1, port2 } = new MessageChannel()

		const iterator = iterable[symbolLookup]()

		const definedOptionalIteratorFns = {
			throw: !!iterator.throw,
			return: !!iterator.return,
		}

		port1.postMessage({
			type: MESSAGE_TYPES.DEFINED_OPTIONAL_ITERATOR_FNS,
			value: definedOptionalIteratorFns,
		})

		listen(iterator, port1)
		return [port2, [port2]]
	},
	deserialize: async (port) => {
		const nextPortMessage = () =>
			new Promise((resolve) => {
				port.onmessage = ({ data }) => {
					resolve(data)
				}
			})

		// First message to come back will advertise functions defined on iterator
		const { value: availableIteratorFns } = await nextPortMessage()

		// Cover the case where a user wants to be able to manually call the iterator methods
		const iterator = {
			next: (value) => {
				port.postMessage({ type: MESSAGE_TYPES.NEXT, value })
				return nextPortMessage()
			},
		}

		// return and throw functions are optional (https://tc39.es/ecma262/#table-async-iterator-optional),
		// so we check they're available
		if (availableIteratorFns.return) {
			iterator.return = (value) => {
				port.postMessage({ type: MESSAGE_TYPES.RETURN, value })
				return nextPortMessage()
			}
		}

		if (availableIteratorFns.throw) {
			iterator.throw = async (value) => {
				port.postMessage({ type: MESSAGE_TYPES.THROW, value })
				return nextPortMessage()
			}
		}

		// Make it iterable so it can be used in for-await-of statement
		iterator[Symbol.asyncIterator] = () => iterator

		return iterator
	},
})

const asyncIterableTransferHandler = makeTransferHandler(Symbol.asyncIterator)
const iterableTransferHandler = makeTransferHandler(Symbol.iterator)

export { asyncIterableTransferHandler, iterableTransferHandler }

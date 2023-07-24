import type { Message } from "./schema.js"

export type MessageQueryApi = {
	create: (args: { data: Message }) => void
	get: (args: { id: Message["id"] }) => Message | undefined
	update: (args: { id: Message["id"]; data: Partial<Message> }) => void
	upsert: (args: { id: Message["id"]; data: Message }) => void
	delete: (args: { id: Message["id"] }) => void
}

/**
 * Creates a query API for messages.
 *
 * Creates an index internally for faster get operations.
 */
export function createQuery(messages: Array<Message>): MessageQueryApi {
	const index = new Map(messages.map((message) => [message.id, message]))
	return {
		create: ({ data }) => {
			index.set(data.id, data)
		},
		get: ({ id }) => {
			return index.get(id)
		},
		update: ({ id, data }) => {
			const message = index.get(id)
			if (message === undefined) return
			index.set(id, { ...message, ...data })
		},
		upsert: ({ id, data }) => {
			const message = index.get(id)
			if (message === undefined) {
				return index.set(id, data)
			}
			index.set(id, { ...message, ...data })
			return
		},
		delete: ({ id }) => {
			index.delete(id)
		},
	}
}

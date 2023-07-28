import type { Message } from "./api.js"

export type MessageQueryApi = {
	create: (args: { data: Message }) => void
	get: (args: { where: { id: Message["id"] } }) => Message | undefined
	getAll: () => Array<Message>
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => void
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => void
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
		get: ({ where }) => {
			return index.get(where.id)
		},
		getAll: () => {
			return Array.from(index.values())
		},
		update: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) return
			index.set(where.id, { ...message, ...data })
		},
		upsert: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) {
				return index.set(where.id, data)
			}
			index.set(where.id, { ...message, ...data })
			return
		},
		delete: ({ where }) => {
			index.delete(where.id)
		},
	}
}

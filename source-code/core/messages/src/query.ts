import type { Message } from "./schema.js"

export type MessageQueryApi = {
	create: (args: { data: Message }) => boolean
	get: (args: { where: { id: Message["id"] } }) => Message | undefined
	getAll: () => Array<Message>
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => boolean
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => boolean
}

/**
 * Creates a query API for messages.
 *
 * - `options.customMap` is an optional custom map implementation to use instead of `Map` (useful for reactivity)
 */
export function createQuery(messages: Array<Message>): MessageQueryApi {
	const index = new Map(messages.map((message) => [message.id, message]))

	return {
		create: ({ data }): boolean => {
			if (index.has(data.id)) return false
			index.set(data.id, data)
			return true
		},
		get: ({ where }) => {
			return structuredClone(index.get(where.id))
		},
		getAll: () => {
			return structuredClone([...index.values()])
		},
		update: ({ where, data }): boolean => {
			const message = index.get(where.id)
			if (message === undefined) return false
			index.set(where.id, { ...message, ...data })
			return true
		},
		upsert: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) {
				index.set(where.id, data)
			} else {
				index.set(where.id, { ...message, ...data })
			}
			return true
		},
		delete: ({ where }): boolean => {
			if (!index.has(where.id)) return false
			index.delete(where.id)
			return true
		},
	}
}

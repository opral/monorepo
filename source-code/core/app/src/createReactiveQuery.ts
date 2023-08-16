import type { Message, MessageQueryApi } from "@inlang/messages"
import { ReactiveMap } from "@solid-primitives/map"
import { createEffect } from "./solid.js"

/**
 * Creates a query API for messages.
 */
export function createReactiveQuery(messages: () => Array<Message>): MessageQueryApi {
	const index = new ReactiveMap<string, Message>()

	createEffect(() => {
		index.clear()
		for (const message of messages()) {
			index.set(message.id, message)
		}
	})

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
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
		create: ({ data }) => {
			index.set(data.id, data)
		},
		get: ({ where }) => {
			return structuredClone(index.get(where.id))
		},
		getAll: () => {
			return structuredClone([...index.values()])
		},
		update: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) return
			index.set(where.id, { ...message, ...data })
		},
		upsert: ({ where, data }) => {
			const message = index.get(where.id)
			if (message === undefined) {
				index.set(where.id, data)
			} else {
				index.set(where.id, { ...message, ...data })
			}
		},
		delete: ({ where }) => {
			index.delete(where.id)
		},
	}
}
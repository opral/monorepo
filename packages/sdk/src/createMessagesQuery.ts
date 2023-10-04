import type { Message } from "@inlang/message"
import { ReactiveMap } from "./reactivity/map.js"
import { createEffect } from "./reactivity/solid.js"
import { createSubscribable } from "./loadProject.js"
import type { InlangProject, MessageQueryApi } from "./api.js"

/**
 * Creates a reactive query API for messages.
 */
export function createMessagesQuery(
	messages: () => Array<Message>
): InlangProject["query"]["messages"] {
	// @ts-expect-error
	const index = new ReactiveMap<string, Message>()

	createEffect(() => {
		index.clear()
		for (const message of structuredClone(messages())) {
			index.set(message.id, message)
		}
	})

	const get = (args: Parameters<MessageQueryApi["get"]>[0]) => index.get(args.where.id)

	return {
		create: ({ data }): boolean => {
			if (index.has(data.id)) return false
			index.set(data.id, data)
			return true
		},
		get: Object.assign(get, {
			subscribe: (
				args: Parameters<MessageQueryApi["get"]["subscribe"]>[0],
				callback: Parameters<MessageQueryApi["get"]["subscribe"]>[1]
			) => createSubscribable(() => get(args)).subscribe(callback),
		}) as any,
		includedMessageIds: createSubscribable(() => {
			return [...index.keys()]
		}),
		getAll: createSubscribable(() => {
			return [...index.values()]
		}),
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

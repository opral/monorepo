import type { Message } from "@inlang/messages"
import { ReactiveMap } from "@solid-primitives/map"
import { createEffect, createMemo } from "./solid.js"
import { createSubscribable } from "./openInlangProject.js"
import type { InlangProject } from "./api.js"

/**
 * Creates a reactive query API for messages.
 */
export function createMessagesQuery(
	messages: () => Array<Message>,
): InlangProject["query"]["messages"] {
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
		get: createSubscribable((args) => {
			if (!args) return undefined
			return structuredClone(index.get(args.where.id))
		}),
		includedMessageIds: createSubscribable(() => {
			return structuredClone([...index.keys()])
		}),
		getAll: createSubscribable(
			createMemo(() => {
				const result: {
					[id: string]: Message
				} = {}
				for (const message of structuredClone([...index.values()])) {
					result[message.id] = message
				}
				return result
			}),
			//return structuredClone([...index.values()])
		),
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

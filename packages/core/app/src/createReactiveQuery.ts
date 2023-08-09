import type { Message, MessageQueryApi } from "@inlang/messages"
import { ReactiveMap } from "@solid-primitives/map"
import { createEffect, createSignal } from "./solid.js"

/**
 * Creates a query API for messages.
 *
 * - `options.customMap` is an optional custom map implementation to use instead of `Map` (useful for reactivity)
 */
export function createReactiveQuery(messages: () => Array<Message>): MessageQueryApi {
	//let index: ReactiveMap<string, Message>
	const [index, setIndex] = createSignal<ReactiveMap<string, Message>>(new ReactiveMap([]))

	createEffect(() => {
		setIndex(new ReactiveMap(messages().map((message) => [message.id, message])))
	})

	return {
		create: ({ data }) => {
			index().set(data.id, data)
		},
		get: ({ where }) => {
			return structuredClone(index().get(where.id))
		},
		getAll: () => {
			return structuredClone([...index().values()])
		},
		update: ({ where, data }) => {
			const message = index().get(where.id)
			if (message === undefined) return
			index()!.set(where.id, { ...message, ...data })
		},
		upsert: ({ where, data }) => {
			const message = index().get(where.id)
			if (message === undefined) {
				return index().set(where.id, data)
			}
			index().set(where.id, { ...message, ...data })
			return
		},
		delete: ({ where }) => {
			index().delete(where.id)
		},
	}
}

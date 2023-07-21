import { createInlang } from "../app/createInlang.js"
import type { Message } from "./schema.js"
/* --------------------- TYPES --------------------- */

type FilterType = {
	id: string
	languageTag: string
	// more properties in the future
}

type QueryOptions = {
	where: Partial<FilterType>[]
}

export type MessagesQueryApi_1 = {
	get: (args?: QueryOptions) => Message[]
	update: (data: Message[]) => Message[]
}

/* --------------------- CRUD --------------------- */

const inlang = createInlang({
	configPath: "/hello/inlang.config.json",
	env: { fs: undefined as any, import: undefined as any },
})

// - create
const message = inlang.messages.update([
	{ id: "myMessageId", languageTag: "en", pattern: [{ type: "Text", value: "Hello World" }] },
])

// - get
const messageOrMessages = inlang.messages.get({
	where: [{ id: "myMessageId", languageTag: "en" }],
})

// - update
const messageOrMessagesUpdated = inlang.messages.update([
	{ id: "myMessageId", languageTag: "en", pattern: [{ type: "Text", value: "Hello World" }] },
])

// - delete
const messageDeleted = inlang.messages.update([
	{ id: "myMessageId", languageTag: "en", pattern: [] },
])

// - list
const messagesAll = inlang.messages.get()

// hide warnings
console.log(message, messageOrMessages, messageOrMessagesUpdated, messageDeleted, messagesAll)

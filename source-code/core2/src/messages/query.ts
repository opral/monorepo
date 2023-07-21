import type { Message } from "./schema.js"
const inlang: any = {}

/* --------------------- TYPES --------------------- */

type UniqueFilterType = {
	id: string
	languageTag: string
	// more properties in the future
}

type QueryOptions = {
	where?: Partial<UniqueFilterType>[]
}

export type MessagesQuery = {
	get: (args: QueryOptions) => Message[]
	update: (data: Message[]) => Message[]
}

/* --------------------- CRUD --------------------- */

// - create
const message = inlang.messages.update([
	{ id: "myMessageId", languageTag: "en", pattern: [{ type: "Text", value: "Hello World" }] },
]) as ReturnType<MessagesQuery["update"]>

// - get
const messageOrMessages = inlang.messages.get({
	where: { id: "myMessageId", languageTag: "en" },
}) as ReturnType<MessagesQuery["get"]>

// - update
const messageOrMessagesUpdated = inlang.messages.update([
	{ id: "myMessageId", languageTag: "en", pattern: [{ type: "Text", value: "Hello World" }] },
]) as ReturnType<MessagesQuery["update"]>

// - delete
const messageDeleted = inlang.messages.update({
	where: { id: "myMessageId", languageTag: "en", pattern: undefined },
}) as ReturnType<MessagesQuery["update"]>

// - list
const messagesAll = inlang.messages.get() as ReturnType<MessagesQuery["get"]>

// hide warnings
console.log(message, messageOrMessages, messageOrMessagesUpdated, messageDeleted, messagesAll)

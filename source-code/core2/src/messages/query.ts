import type { Message } from "./schema.js"

type UniqueFilterType = {
	id: string
	languageTag: string
	//variant: string -> in the future
}
type FilterType = {
	id?: string
	languageTag?: string
	//variant?: string -> in the future
}

// inspiration: Prisma CRUD https://www.prisma.io/docs/concepts/components/prisma-client/crud
export type MessagesQueryApi_1 = {
	create: (message: Message) => Message
	get: (where: UniqueFilterType) => Message
	getMany: (where: FilterType) => Message[]
	update: (where: UniqueFilterType, data: Message["pattern"]) => Message
	delete: (where: UniqueFilterType) => Message
}

// example usage
const message = inlang.messages.query.create({ id: "myMessageId", languageTag: "en", pattern: [{"type": "Text", value:  "Hello World" }]})

const message = inlang.messages.query.get({ where: { id: "myMessageId", languageTag: "en" })
const messages = inlang.messages.query.getMany({ where: { id: "myMessageId" })

const message = inlang.messages.query.update({ where: { id: "myMessageId", languageTag: "en" }, data: { pattern: [{"type": "Text", value:  "Hello World" }] } })

const message = inlang.messages.query.delete({ where: { id: "myMessageId", languageTag: "en" } })
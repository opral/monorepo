import { createInlang } from "../app/createInlang.js"
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
	create: (args: Message) => Message
	get: (args: { where: UniqueFilterType }) => [Message, Error]
	getMany: (args: { where: FilterType }) => [Message[], Error]
	upsert: (args: Message) => [Message, Error]
	upsertMany: (args: Message[]) => [Message[], Error]
	delete: (args: { where: UniqueFilterType }) => [Message, Error]
	deleteMany: (args: { where: FilterType }) => [Message[], Error]
}

const inlang = createInlang({
	configPath: "/hello/inlang.config.json",
	env: { fs: undefined as any, import: undefined as any },
})

// example usage
const message1 = inlang.messages.query.create({
	id: "myMessageId",
	languageTag: "en",
	pattern: [{ type: "Text", value: "Hello World" }],
})

const message2 = inlang.messages.query.get({ where: { id: "myMessageId", languageTag: "en" } })
const messages = inlang.messages.query.getMany({ where: { id: "myMessageId" } })

const message4 = inlang.messages.query.upsert({
	id: "myMessageId",
	languageTag: "en",
	pattern: [{ type: "Text", value: "Hello World" }],
})

const message5 = inlang.messages.query.delete({ where: { id: "myMessageId", languageTag: "en" } })

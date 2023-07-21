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

type GetType = {
	where: UniqueFilterType
}

type GetManyType = {
	where: FilterType
}

type UpdateType = {
	where: UniqueFilterType
	pattern: Message["pattern"]
}

type UpsertType = {
	where: UniqueFilterType
	pattern: Message["pattern"]
	message: Message
}

type DeleteType = {
	where: FilterType
}

// inspiration: Prisma CRUD https://www.prisma.io/docs/concepts/components/prisma-client/crud
export type MessagesQueryApi_1 = {
	create: (args: Message) => Message
	get: (args: GetType) => Message
	getMany: (args: GetManyType) => Message[]
	update: (args: UpdateType) => Message
	upsert: (args: UpsertType) => Message
	delete: (args: DeleteType) => Message
}

const inlang = createInlang({
	configPath: "/hello/inlang.config.json",
	env: { fs: undefined as any, import: undefined as any },
})

// example usage
const message = inlang.messages.query.create({
	id: "myMessageId",
	languageTag: "en",
	pattern: [{ type: "Text", value: "Hello World" }],
})

const message = inlang.messages.query.get({ where: { id: "myMessageId", languageTag: "en" } })
const messages = inlang.messages.query.getMany({ where: { id: "myMessageId" } })

const message = inlang.messages.query.update({
	where: { id: "myMessageId", languageTag: "en" },
	pattern: [{ type: "Text", value: "Hello World" }],
})

const message = inlang.messages.query.upsert({
	where: { id: "myMessageId", languageTag: "en" },
	pattern: [{ type: "Text", value: "Hello World" }],
	message: {
		id: "myMessageId",
		languageTag: "en",
		pattern: [{ type: "Text", value: "Hello World" }],
	},
})

const message = inlang.messages.query.delete({ where: { id: "myMessageId", languageTag: "en" } })

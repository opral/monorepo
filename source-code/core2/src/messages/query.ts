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

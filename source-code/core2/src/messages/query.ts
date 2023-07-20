import type { Message } from "./schema.js"

// TODO
// 1. Query builder?
// 2. Filtering etc how?
//
// inspiration: Prisma CRUD https://www.prisma.io/docs/concepts/components/prisma-client/crud
export type MessagesQueryApi_1 = {
	create: (message: Message) => void
	get: () => Message[]
	update: () => void
	delete: () => void
}

// query.

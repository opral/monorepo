import type { Bundle, Message, Variant } from "./schema.js"

export type MessageWithVariants = Message & {
	variants: Variant[]
}

export type BundleWithMessages = Bundle & {
	messages: MessageWithVariants[]
}

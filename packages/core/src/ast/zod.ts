import { z } from "zod"

/**
 * The zod schemas for the AST.
 *
 * The zod schema can be used to parse and validate
 * the AST nodes. Read more at https://zod.dev/
 */

const Node = z.object({
	type: z.string(),
	metadata: z.any().optional(),
})

const Identifier = Node.extend({
	type: z.literal("Identifier"),
	name: z.string(),
})

const LanguageTag = Node.extend({
	type: z.literal("LanguageTag"),
	name: z.string(),
})

const Text = Node.extend({
	type: z.literal("Text"),
	value: z.string(),
})

const VariableReference = Node.extend({
	type: z.literal("VariableReference"),
	name: z.string(),
})

const Placeholder = Node.extend({
	type: z.literal("Placeholder"),
	body: VariableReference,
})

const Pattern = Node.extend({
	type: z.literal("Pattern"),
	elements: z.array(Text.or(Placeholder)),
})

const Message = Node.extend({
	type: z.literal("Message"),
	id: Identifier,
	pattern: Pattern,
})

export const Resource = Node.extend({
	type: z.literal("Resource"),
	languageTag: LanguageTag,
	body: z.array(Message),
})

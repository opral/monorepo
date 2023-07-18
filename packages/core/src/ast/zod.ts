import { z } from "zod"

/**
 * The zod schemas for the AST.
 *
 * The zod schema can be used to parse and validate
 * the AST nodes. Read more at https://zod.dev/
 */

const Identifier = z.object({
	type: z.literal("Identifier"),
	name: z.string(),
})

const LanguageTag = z.object({
	type: z.literal("LanguageTag"),
	name: z.string(),
})

const Text = z.object({
	type: z.literal("Text"),
	value: z.string(),
})

const VariableReference = z.object({
	type: z.literal("VariableReference"),
	name: z.string(),
})

const Placeholder = z.object({
	type: z.literal("Placeholder"),
	body: VariableReference,
})

const Pattern = z.object({
	type: z.literal("Pattern"),
	elements: z.array(Text.or(Placeholder)),
})

const Message = z.object({
	type: z.literal("Message"),
	id: Identifier,
	pattern: Pattern,
})

export const Resource = z.object({
	type: z.literal("Resource"),
	languageTag: LanguageTag,
	body: z.array(Message),
})

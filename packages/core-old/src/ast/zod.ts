import { z } from "zod"

/**
 * The zod schemas for the AST.
 *
 * The zod schema can be used to parse and validate
 * the AST nodes. Read more at https://zod.dev/
 */

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

export const Message = z.object({
	id: z.string(),
	languageTag: z.string(),
	pattern: z.array(Text.or(Placeholder)),
})

/**
 * This file contains the Zod schema for the AST.
 *
 * The zod schema is used for validation in /test.
 * Read more at https://zod.dev/
 */

import { z } from "zod"

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

const Pattern = Node.extend({
	type: z.literal("Pattern"),
	elements: z.array(Text),
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

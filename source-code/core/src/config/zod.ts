import { z } from "zod"
import { Message } from "../ast/zod.js"
import { zodIdeExtensionConfigSchema } from "./ideExtension/zodSchema.js"
import type { BCP47LanguageTag } from "../languageTag/types.js"

/**
 * The zod schema for the config.
 *
 * The zod schema can be used to parse and
 * validate the config schema. Read more
 * at https://zod.dev/
 */
export const zConfig = z.object({
	sourceLanguageTag: z
		.string()
		.transform((value) => value as BCP47LanguageTag)
		// optional as long as interop with old configs is required
		.optional(),
	languageTags: z
		.array(z.string())
		.refine((items) => new Set(items).size === items.length, {
			message: "Languages contains duplicates. The provided languages must be unique.",
		})
		// optional as long as interop with old configs is required
		.optional(),
	lint: z
		.object({
			rules: z.array(z.any()),
		})
		.optional(),
	getMessages: z
		.function()
		.args(z.any())
		.returns(z.promise(z.array(Message))),
	saveMessages: z.function().args(z.any()).returns(z.promise(z.void())),
	ideExtension: zodIdeExtensionConfigSchema.optional(),
	plugins: z.union([z.undefined(), z.array(z.object({ id: z.string(), config: z.function() }))]),
	// TODO define lint and experimental
})

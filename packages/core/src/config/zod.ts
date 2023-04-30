import { z } from "zod"
import { Resource } from "../ast/zod.js"
import type { Language } from "../ast/schema.js"

/**
 * The zod schema for the config.
 *
 * The zod schema can be used to parse and
 * validate the config schema. Read more
 * at https://zod.dev/
 */
export const zConfig = z.object({
	referenceLanguage: z.string().transform((value) => value as Language),
	languages: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
		message: "Languages contains duplicates. The provided languages must be unique.",
	}),
	readResources: z
		.function()
		.args(z.any())
		.returns(z.promise(z.array(Resource))),
	writeResources: z.function().args(z.any()).returns(z.promise(z.void())),
	plugins: z.union([z.undefined(), z.array(z.object({ id: z.string(), config: z.function() }))]),
	// TODO define lint and experimental
})

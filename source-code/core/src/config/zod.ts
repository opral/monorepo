import { z } from "zod"
import type { Language } from "../ast/schema.js"
import { Resource } from "../ast/zod.js"

/**
 * The zod schema for the config.
 *
 * The zod schema can be used to parse and
 * validate the config schema. Read more
 * at https://zod.dev/
 */
export const Config = z.object({
	referenceLanguage: z.string().transform((value) => value as Language),
	languages: z.array(z.string()),
	readResources: z
		.function()
		.args(z.any())
		.returns(z.promise(z.array(Resource))),
	writeResources: z.function().args(z.any()).returns(z.promise(z.void())),
	// TODO define lint and experimental
})

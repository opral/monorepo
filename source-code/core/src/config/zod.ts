/**
 * This file contains the Zod schema for the AST.
 *
 * The zod schema is used for validation in /test.
 * Read more at https://zod.dev/
 */

import { z } from "zod"
import { Resource } from "../ast/zod.js"

export const Config = z.object({
	referenceLanguage: z.string(),
	languages: z.array(z.string()),
	readResources: z
		.function()
		.args(z.any())
		.returns(z.promise(z.array(Resource))),
	writeResources: z.function().args(z.any()).returns(z.promise(z.void())),
	// TODO define lint and experimental
})

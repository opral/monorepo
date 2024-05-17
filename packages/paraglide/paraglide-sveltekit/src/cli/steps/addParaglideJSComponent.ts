import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import type { Logger } from "@inlang/paraglide-js/internal"

export const addParaglideJSComponent: CliStep<
	{ repo: Repository; logger: Logger },
	unknown
> = async (ctx) => {
	return ctx
}

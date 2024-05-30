import type { Repository } from "@lix-js/client"
import type { Logger } from "@inlang/paraglide-js/internal"
import type { CliStep } from "../utils.js"

export const updateAppTypes: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	unknown
> = async (ctx) => {
	return ctx
}

type UpdateResult =
	| {
			ok: true
			updated: string
			reason?: undefined
	  }
	| {
			ok: false
			reason: string
			updated?: undefined
	  }

/**
 * @private
 */
export function updateAppDTsFile(code: string): UpdateResult {
	// add the type import
	if (code.includes("AvailableLanguageTag")) {
		return { ok: false, reason: "Paraglide types already present" }
	}

	code = 'import type { AvailableLanguageTag } from "$lib/paraglide/runtime"\n' + code

	const LocalsInterfaceRegex = /interface\s+Locals\s*\{/g
	const match = LocalsInterfaceRegex.exec(code)
	if (!match) {
		return { ok: false, reason: "Could not find the Locals interface" }
	}

	// add the type to the Locals interface
	const endIndex = match.index + match[0].length
	const before = code.slice(0, endIndex)
	const after = code.slice(endIndex)

	const beforeLines = before.split("\n")
	beforeLines[beforeLines.length - 1] = beforeLines.at(-1)?.replace("//", "") || ""

	code =
		beforeLines.join("\n") +
		"\n    paraglide: {\n        lang: AvailableLanguageTag,\n        textDirection: 'ltr' | 'rtl'\n    },\n" +
		after

	return {
		ok: true,
		updated: code,
	}
}

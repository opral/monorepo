import type { InlangProject } from "@inlang/sdk"
import { dedent } from "ts-dedent"

/**
 * Compiles an inlang project into the importable paraglide-js library.
 */
export const compileProjectToLibrary = (args: {
	inlang: InlangProject
}): Record<string, string> => {
	console.info(args.inlang)
	return {
		"index.js": dedent`
		`,
		"library.js": dedent`
			export const t = () => {
				
			}
		`,
		"messages.js": dedent`
			
		`,
	}
}

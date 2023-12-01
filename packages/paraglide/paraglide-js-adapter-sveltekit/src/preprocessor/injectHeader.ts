import { HEADER_COMPONENT_MODULE_ID } from "../constants.js"
import type { PreprocessingPass } from "./index.js"

export const InjectHeader: PreprocessingPass = {
	condition: ({ filename }) => {
		return filename.endsWith("+page.svelte")
	},
	apply: ({ ast, code }) => {
		//add the header component into the code. Placement does not matter
		code.appendLeft(ast.html.end, `<PARAGLIDE_HEADER />`)

		return {
			imports: [`import PARAGLIDE_HEADER from '${HEADER_COMPONENT_MODULE_ID}';`],
		}
	},
}

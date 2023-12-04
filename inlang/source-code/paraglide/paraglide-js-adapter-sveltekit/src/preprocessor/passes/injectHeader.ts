import { HEADER_COMPONENT_MODULE_ID } from "../../constants.js"
import type { PreprocessingPass } from "../index.js"

export const InjectHeader: PreprocessingPass = {
	condition: ({ filename }) => {
		return filename.endsWith("+page.svelte")
	},
	apply: ({ code }) => {
		//add the header component into the code. Placement does not matter
		code.append(`<PARAGLIDE_HEADER />`)

		return {
			imports: [`import PARAGLIDE_HEADER from '${HEADER_COMPONENT_MODULE_ID}';`],
		}
	},
}

import { HEADER_COMPONENT_MODULE_ID, HEADER_COMPONENT_NAME } from "../../constants.js"
import type { PreprocessingPass } from "../index.js"

export const InjectHeader: PreprocessingPass = {
	condition: ({ filename }) => {
		return filename.endsWith("+page.svelte")
	},
	apply: ({ code }) => {
		//add the header component into the code. Placement does not matter
		code.append(`<${HEADER_COMPONENT_NAME} />`)

		return {
			imports: [`import ${HEADER_COMPONENT_NAME} from '${HEADER_COMPONENT_MODULE_ID}';`],
		}
	},
}

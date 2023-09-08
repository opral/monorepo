import type { VNode } from "./markup.js"

/**
 * Remove commas from the json.
 *
 * @description When using array.map, satori-html adds commas to the json, which is not valid json for the satori package.
 * @param json The json to remove the commas from.
 * @returns The json without commas.
 */
export const removeCommas = (json: VNode): VNode | undefined => {
	if (!json) return
	if (json.props && json.props.children && Array.isArray(json.props.children)) {
		// @ts-ignore
		json.props.children = json.props.children?.filter((child) => child !== ",")
		// @ts-ignore
		json.props.children = json.props.children?.map(removeCommas)
	}
	return json
}

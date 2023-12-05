import { currentPageContext } from "#src/renderer/state.js"
import sdkTableOfContents from "../../../../../documentation/sdk/tableOfContents.json"
import pluginTableOfContents from "../../../../../documentation/plugin/tableOfContents.json"

export const getTableOfContents = () => {
	switch (currentPageContext.urlParsed.pathname.split("/")[2]) {
		case "plugin":
			return pluginTableOfContents as typeof pluginTableOfContents
		default:
			return sdkTableOfContents as typeof sdkTableOfContents
	}
}

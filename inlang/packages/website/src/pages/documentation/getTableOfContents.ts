import { currentPageContext } from "#src/renderer/state.js";
import sdkTableOfContentsRaw from "../../../../../documentation/sdk/tableOfContents.json?raw";
import pluginTableOfContentsRaw from "../../../../../documentation/plugin/tableOfContents.json?raw";
import lintRuleTableOfContentsRaw from "../../../../../documentation/lint-rule/tableOfContents.json?raw";
import ecosystemTableOfContentsRaw from "../../../../../documentation/ecosystem/tableOfContents.json?raw";

const sdkTableOfContents = JSON.parse(sdkTableOfContentsRaw);
const pluginTableOfContents = JSON.parse(pluginTableOfContentsRaw);
const lintRuleTableOfContents = JSON.parse(lintRuleTableOfContentsRaw);
const ecosystemTableOfContents = JSON.parse(ecosystemTableOfContentsRaw);

export const getTableOfContents = () => {
	switch (currentPageContext.urlParsed.pathname.split("/")[2]) {
		case "plugin":
			return pluginTableOfContents as typeof pluginTableOfContents;
		case "lint-rule":
			return lintRuleTableOfContents as typeof lintRuleTableOfContents;
		case "sdk":
			return sdkTableOfContents as typeof sdkTableOfContents;
		default:
			return ecosystemTableOfContents as typeof ecosystemTableOfContents;
	}
};

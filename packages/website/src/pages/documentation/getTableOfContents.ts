import { currentPageContext } from "#src/renderer/state.js";
import sdkTableOfContents from "../../../../../documentation/sdk/tableOfContents.json";
import pluginTableOfContents from "../../../../../documentation/plugin/tableOfContents.json";
import lintRuleTableOfContents from "../../../../../documentation/lint-rule/tableOfContents.json";
import ecosystemTableOfContents from "../../../../../documentation/ecosystem/tableOfContents.json";

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

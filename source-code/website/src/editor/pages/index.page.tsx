import type { GitRouteParams } from "./index.page.route.js";
import { currentPageContext } from "@src/renderer/state.js";
import type { PageHead } from "@src/renderer/types.js";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	return (
		<h1>
			hi from git{" "}
			{(currentPageContext().routeParams as GitRouteParams).provider}
		</h1>
	);
}

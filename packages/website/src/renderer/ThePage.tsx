import { createEffect } from "solid-js";
import { Dynamic } from "solid-js/web";
import { currentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";

export function ThePage() {
	createEffect(() => {
		console.log("new page context triggered in ThePage");
		console.log({ props: currentPageContext.props });
	});

	return (
		<Dynamic
			component={(currentPageContext as PageContextRenderer).Page}
			{...currentPageContext.props}
		></Dynamic>
	);
}

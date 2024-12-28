import { getDocsBaseUrl } from "#src/interface/sdkDocs/SdkDocsHeader.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import { Show } from "solid-js";
import { ArrowLinkIcon } from "./icons/TinyIcons.jsx";

const NavbarOtherPageIndicator = (props: { slug: string }) => {
	return (
		<div class="text-surface-700 opacity-30 w-4 h-4">
			<Show
				when={
					getDocsBaseUrl(currentPageContext.urlParsed.pathname) !==
					getDocsBaseUrl("/documentation/" + props.slug)
				}
			>
				<ArrowLinkIcon />
			</Show>
		</div>
	);
};

export default NavbarOtherPageIndicator;

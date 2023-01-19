import type { PageContextRenderer, PageHead } from "./types.js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";
import { Match, Switch } from "solid-js";

export const Head: PageHead = (props) => ({
	title: "inlang Error",
	description:
		"Manage translations and localization processes with inlang's editor.",
});
//TODO add header and footer if its possible
export function Page(pageContext: PageContextRenderer) {
	return (
		<div class="min-h-screen flex  items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg bg-danger-container">
				<Switch>
					<Match when={pageContext.is404}>
						<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center"></MaterialSymbolsUnknownDocumentOutlineRounded>
						<h1 class="font-semibold pt-5 ">404</h1>
						<p class="pt-1.5">
							Something went wrong, we couldn't find your page.
						</p>

						<a class="self-end pt-5" href="https://inlang.com">
							<sl-button prop:variant="text">
								Back home to inlang.com
								<MaterialSymbolsArrowOutwardRounded slot="suffix"></MaterialSymbolsArrowOutwardRounded>
							</sl-button>
						</a>
					</Match>
					<Match when={!pageContext.is404}>
						<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center"></MaterialSymbolsUnknownDocumentOutlineRounded>
						<h1 class="font-semibold pt-5 ">Error</h1>
						<p class="pt-1.5">
							Houston we have a problem. Sincere apologies. Please Try again
							later and report this Bug.
						</p>
						<a
							class="self-end pt-5"
							href="https://github.com/inlang/inlang/issues/new/choose"
							target="_blank"
						>
							<sl-button prop:variant="text">
								Report a Bug
								<MaterialSymbolsArrowOutwardRounded slot="suffix"></MaterialSymbolsArrowOutwardRounded>
							</sl-button>
						</a>
					</Match>
				</Switch>
			</div>
		</div>
	);
}

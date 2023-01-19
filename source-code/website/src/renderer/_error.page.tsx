import type { PageContextRenderer, PageHead } from "./types.js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";

export const Head: PageHead = (props) => ({
	title: "inlang Editor",
	description:
		"Manage translations and localization processes with inlang's editor.",
});
//TODO add header and footer if its possible
export function Page(pageContext: PageContextRenderer) {
	if (pageContext.is404) {
		return (
			<div class="min-h-screen flex  items-center justify-center">
				<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
					<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center"></MaterialSymbolsUnknownDocumentOutlineRounded>
					<h1 class="font-semibold pt-5 text-danger">404</h1>
					<p class="pt-1.5">
						Something went wrong, we couldn't find your page.
					</p>

					<a
						class="self-end pt-5"
						href="https://inlang.com/documentation/getting-started"
						target="_blank"
					>
						<sl-button prop:variant="text">
							I need help with getting started
							<MaterialSymbolsArrowOutwardRounded slot="suffix"></MaterialSymbolsArrowOutwardRounded>
						</sl-button>
					</a>
				</div>
			</div>
		);
	} else {
		return (
			<div class="min-h-screen flex  items-center justify-center">
				<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
					<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center"></MaterialSymbolsUnknownDocumentOutlineRounded>
					<h1 class="font-semibold pt-5 text-danger">Error</h1>
					<p class="pt-1.5">
						Our server is having problems. Sincere apologies. Try again later.
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
				</div>
			</div>
		);

		// Return a UI component "Our server is having problems. Sincere apologies. Try again later."
	}
}

// export function Page(pageProps) {
// 	console.log(pageProps.is404);
// 	if (pageProps.is404) {
// 		// Return a UI component "Page Not Found."
// 	} else {
// 		// Return a UI component "Our server is having problems. Sincere apologies. Try again later."
// 	}
// }

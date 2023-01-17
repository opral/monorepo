import type { PageContextRenderer, PageHead } from "./types.js";

export const Head: PageHead = (props) => ({
	title: "inlang Editor",
	description:
		"Manage translations and localization processes with inlang's editor.",
});

export function Page(pageContext: PageContextRenderer) {
	if (pageContext.is404) {
		console.log(pageContext.is404, "is a ");
		// Return a UI component "Page Not Found."
		return (
			<div class="flex-row min-h-full w-full self-center justify-center mx-auto md:max-w-2xl ">
				<a href="https://inlang.com/" class="text-ellipsis space-y-4">
					<h2 class="text-xl font-bold tracking-tight text-on-backround truncate">
						Page Not Found.
					</h2>

					<p class="link text-primary link-primary"> 404</p>
				</a>
			</div>
		);
	} else {
		console.log(pageContext.pageProps, "is not 404");

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

import { Navigation } from "./Navigation.jsx";
import { MobileNav } from "./MobileNav.jsx";
import { tableOfContents } from "./tableOfContents.js";
import type { PageHead } from "@src/renderer/types.js";
import { Show } from "solid-js";
import { Layout as RootLayout } from "@src/pages/Layout.jsx";

export const Head: PageHead = () => {
	return {
		title: "Documentation",
		description: "Documentation",
	};
};

export type PageProps = {
	markdown?: string;
};

export function Page(props: PageProps) {
	return (
		<RootLayout>
			<div class="sm:grid sm:grid-cols-9 gap-10 py-4 w-full">
				<div class="hidden sm:flex col-span-2 sticky top-0">
					<Navigation sections={tableOfContents} />
				</div>

				<MobileNav sections={tableOfContents} />
				<Show when={props.markdown} fallback={<Error></Error>}>
					<div
						class="w-full sm:col-span-7 ml:px-8 prose justify-self-center"
						innerHTML={props.markdown}
					></div>
				</Show>
			</div>
		</RootLayout>
	);
}

function Error() {
	return (
		<div>
			<p class="text-danger text-lg font-medium">
				The requested page could not be requested or rendered.
			</p>
			<p class="text-danger">
				Please{" "}
				<a
					class="link text-primary"
					target="_blank"
					href="https://github.com/inlang/inlang/issues/new/choose"
				>
					report the bug.
				</a>
			</p>
		</div>
	);
}

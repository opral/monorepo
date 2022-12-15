import { tableOfContent } from "../tableOfContent.js";
import type { PageHead } from "@src/renderer/types.js";
import { Show } from "solid-js";

export const Head: PageHead = () => {
	return {
		title: "Blog",
		description: "Blog",
	};
};

export type PageProps = {
	markdown?: string;
};

export function Page(props: PageProps) {
	return (
		<div class="py-4 w-full mx-auto divide-y divide-solid divide-outline sm:grid sm:grid-cols-9 gap-10">
			<p class="sm:flex col-span-2  top-0">
				<a
					class="sticky h-fit top-[3.5rem] overflow-y-auto w-full "
					href="/blog"
				>
					&lt;- Back to Blog
				</a>
			</p>

			<Show when={props.markdown} fallback={<Error></Error>}>
				<div
					class="prose mx-auto w-full  sm:col-span-7 ml:px-8  justify-self-center"
					innerHTML={props.markdown}
				></div>
			</Show>
		</div>
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

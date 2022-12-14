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
		<div class="py-4 w-full mx-auto divide-y divide-solid divide-outline">
			<Show when={props.markdown} fallback={<Error></Error>}>
				<div class=" prose mx-auto w-full" innerHTML={props.markdown}></div>
				<a class=" flex justify-center link link-primary py-4" href="/blog">
					&lt;- Back to Index
				</a>
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

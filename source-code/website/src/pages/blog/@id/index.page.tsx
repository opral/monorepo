import { Layout } from "@src/pages/Layout.jsx";
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
		<Layout>
			<div class="grid-row-2 py-4 w-full mx-auto ">
				<Show when={props.markdown} fallback={<Error></Error>}>
					<div
						class="prose mx-auto w-full 7 ml:px-8 justify-self-center"
						innerHTML={props.markdown}
					></div>
				</Show>
				<a
					class="flex justify-center link link-primary py-4 text-primary "
					href="/blog"
				>
					&lt;- Back to Blog
				</a>
			</div>
		</Layout>
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

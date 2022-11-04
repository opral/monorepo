import type { GitRouteParams } from "./index.page.route.js";
import { currentPageContext } from "@src/renderer/state.js";
import type { PageHead } from "@src/renderer/types.js";
import { createSignal, onMount } from "solid-js";
import { onHello } from "./index.telefunc.js";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	const [gitIsInitialized, setGitIsInitialized] = createSignal(false);

	onMount(async () => {
		const { raw } = await import("@inlang/git-sdk/api");
		const { fs } = await import("@inlang/git-sdk/fs");
		await raw.init({ fs, dir: "/test-editor" });
		const dir = await fs.promises.readdir("/test-editor");
		console.log(dir);

		const helloResult = await onHello({ name: "samuel" });
		console.log(helloResult);
	});

	return (
		<h1>
			hi from git{" "}
			{/* {(currentPageContext().routeParams as GitRouteParams).provider} */}
		</h1>
	);
}
